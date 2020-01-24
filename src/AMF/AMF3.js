'use strict'

/**
 * Our dependencies
 * @constant
 */
const ByteArray = require('bytearray-node')
const { murmurHash128 } = require('murmurhash-native')

/**
 * Our enums
 * @constant
 */
const Util = require('./util')
const { isImplementedBy } = require('../../enums/IExternalizable')

/**
 * The AMF3 markers
 * @constant
 */
const Markers = {
  UNDEFINED: 0x00,
  NULL: 0x01,
  FALSE: 0x02,
  TRUE: 0x03,
  INT: 0x04,
  DOUBLE: 0x05,
  STRING: 0x06,
  DATE: 0x08,
  ARRAY: 0x09,
  OBJECT: 0x0A,
  BYTEARRAY: 0x0C,
  DICTIONARY: 0x11,
  VECTOR_INT: 0x0D,
  VECTOR_UINT: 0x0E,
  VECTOR_DOUBLE: 0x0F
}

/**
 * @exports
 * @class
 */
module.exports = class AMF3 {
  /**
   * @constructor
   * @param {ByteArray} byteArr
   */
  constructor(byteArr) {
    /**
     * The ByteArray base
     * @type {ByteArray}
     */
    this.byteArr = byteArr
    /**
     * The flags, used for length
     * @type {Number}
     */
    this.flags = 0
    /**
     * The reference, used to return the referenceable value
     * @type {*}
     */
    this.reference = null
    /**
     * The array of string references
     * @type {Array}
     */
    this.stringReferences = []
    /**
     * The array of object references
     * @type {Array}
     */
    this.objectReferences = []
    /**
     * The array of trait references
     * @type {Array}
     */
    this.traitReferences = []
  }

  /**
   * Reads a variable-length unsigned 29-bit integer
   * @returns {Number}
   */
  readUInt29() {
    let int = 0

    for (let i = 0; i < 4; i++) {
      const byte = this.byteArr.readUnsignedByte()

      int = i === 3 ? (int << 8) + byte : (int << 7) + (byte & 0x7F)

      if (!(byte & 0x80)) {
        break
      }
    }

    return int
  }

  /**
   * Writes a variable-length unsigned 29-bit integer
   * @param {Number} value
   */
  writeUInt29(value) {
    if (value < 0x80) {
      this.byteArr.writeUnsignedByte(value)
    } else if (value < 0x4000) {
      this.byteArr.writeUnsignedByte(((value >> 7) & 0x7F) | 0x80)
      this.byteArr.writeUnsignedByte(value & 0x7F)
    } else if (value < 0x200000) {
      this.byteArr.writeUnsignedByte(((value >> 14) & 0x7F) | 0x80)
      this.byteArr.writeUnsignedByte(((value >> 7) & 0x7F) | 0x80)
      this.byteArr.writeUnsignedByte(value & 0x7F)
    } else if (value < 0x40000000) {
      this.byteArr.writeUnsignedByte(((value >> 22) & 0x7F) | 0x80)
      this.byteArr.writeUnsignedByte(((value >> 15) & 0x7F) | 0x80)
      this.byteArr.writeUnsignedByte(((value >> 8) & 0x7F) | 0x80)
      this.byteArr.writeUnsignedByte(value & 0xFF)
    } else {
      throw new RangeError(`The value: '${value}' is out of range for uint29.`)
    }
  }

  /**
   * Pops a flag, used for knowing what the remaining bits are
   * @returns {Boolean}
   */
  popFlag() {
    const ref = this.flags & 1

    this.flags >>= 1

    return Boolean(ref)
  }

  /**
   * Set the current reference
   * @param {String} table
   * @returns {Boolean}
   */
  isReference(table) {
    this.reference = null

    if (table !== 'traitReferences') {
      const bits = this.readUInt29()

      if (Util.isUInt29(bits)) {
        this.flags = bits
      } else {
        throw new RangeError(`The value: '${bits}' is out of range for uint29.`)
      }
    }

    const isReference = !this.popFlag()

    if (isReference) {
      this.reference = this[table][this.flags]
    }

    return isReference
  }

  /**
   * Get or set a reference
   * @param {String|Object} value
   * @param {String} table
   * @returns {Number|Boolean}
   */
  getReference(value, table) {
    const idx = this[table].indexOf(value)

    if (idx >= 0) {
      return idx
    } else {
      this[table].push(value)

      return false
    }
  }

  /**
   * Write a string
   * @param {String} value
   * @param {Boolean} useType
   */
  writeString(value, useType = true) {
    if (useType) {
      this.byteArr.writeByte(Markers.STRING)
    }

    if (value.length === 0) {
      this.writeUInt29(1)
    } else {
      const idx = this.getReference(value, 'stringReferences')

      if (idx !== false) {
        this.writeUInt29(idx << 1)
      } else {
        this.writeUInt29((value.length << 1) | 1)
        this.byteArr.writeUTFBytes(value)
      }
    }
  }

  /**
   * Read a string
   * @returns {String}
   */
  readString() {
    if (this.isReference('stringReferences')) {
      return this.reference
    }

    const length = this.flags
    const value = length > 0 ? this.byteArr.readUTFBytes(length) : ''

    if (length > 0) {
      this.stringReferences.push(value)
    }

    return value
  }

  /**
   * Write a date
   * @param {Date} value
   */
  writeDate(value) {
    const idx = this.getReference(value, 'objectReferences')

    if (idx !== false) {
      this.writeUInt29(idx << 1)
    } else {
      this.writeUInt29(1)
      this.byteArr.writeDouble(value.getTime())
    }
  }

  /**
   * Read a date
   * @returns {Date}
   */
  readDate() {
    if (this.isReference('objectReferences')) {
      return this.reference
    }

    const date = new Date(this.byteArr.readDouble())

    this.objectReferences.push(date)

    return date
  }

  /**
   * Write an array
   * @param {Array} value
   */
  writeArray(value) {
    const idx = this.getReference(value, 'objectReferences')

    if (idx !== false) {
      this.writeUInt29(idx << 1)
    } else {
      if (Util.isDenseArray(value)) {
        this.writeUInt29((value.length << 1) | 1)
        this.writeUInt29(1)

        for (const i in value) {
          this.write(value[i])
        }
      } else {
        this.writeUInt29(1)

        for (const key in value) {
          this.writeString(key, false)
          this.write(value[key])
        }

        this.writeUInt29(1)
      }
    }
  }

  /**
   * Read an array
   * @returns {Array}
   */
  readArray() {
    if (this.isReference('objectReferences')) {
      return this.reference
    }

    const value = []
    const length = this.flags

    this.objectReferences.push(value)

    for (let key = this.readString(); key !== ''; value[key] = this.read(), key = this.readString()) { }

    for (let i = 0; i < length; i++) {
      value[i] = this.read()
    }

    return value
  }

  /**
   * Write an object
   * @param {Object} value
   * @param {Boolean} isAnonymousObject
   */
  writeObject(value, isAnonymousObject = false) {
    const idx = this.getReference(value, 'objectReferences')

    if (idx !== false) {
      this.writeUInt29(idx << 1)
    } else {
      const traits = this.writeTraits(value, isAnonymousObject)

      if (traits.isExternallySerialized) {
        if (value.writeExternal.length !== 1) {
          throw new Error(`Expecting only 1 argument for writeExternal in registered class: '${traits.className}'`)
        }

        value.writeExternal(this.byteArr)
      } else {
        if (traits.isDynamicObject) {
          for (const key in value) {
            this.writeString(key, false)
            this.write(value[key])
          }

          this.writeUInt29(1)
        } else {
          for (let i = 0; i < traits.sealedMemberCount; i++) {
            this.writeString(traits.sealedMemberNames[i], false)

            if (!traits.isDynamicObject) {
              this.write(value[traits.sealedMemberNames[i]])
            }
          }

          if (traits.isDynamicObject) {
            for (let i = 0; i < traits.sealedMemberCount; i++) {
              this.write(value[traits.sealedMemberNames[i]])
            }
          } else {
            this.writeUInt29(1)
          }
        }
      }
    }
  }

  /**
   * Write object traits
   * @param {Object} value
   * @param {Boolean} isAnonymousObject
   * @returns {Object}
   */
  writeTraits(value, isAnonymousObject) {
    const className = value.constructor === Object || isAnonymousObject ? '' : this.byteArr.classMapping.get(value.constructor)
    const isExternallySerialized = isImplementedBy(value)
    const isDynamicObject = className === '' && !isAnonymousObject
    const sealedMemberNames = isDynamicObject || isExternallySerialized ? [] : Object.keys(value)
    const sealedMemberCount = sealedMemberNames.length

    const traits = { isExternallySerialized, isDynamicObject, sealedMemberCount, className, sealedMemberNames }
    const idx = this.getReference(murmurHash128(JSON.stringify(traits)), 'traitReferences')

    if (idx !== false) {
      this.writeUInt29((idx << 2) | 1)
    } else {
      this.writeUInt29(3 | (isExternallySerialized ? 4 : 0) | (isDynamicObject ? 8 : 0) | (sealedMemberCount << 4))
      this.writeString(className, false)
    }

    return traits
  }

  /**
   * Read an object
   * @returns {Object}
   */
  readObject() {
    if (this.isReference('objectReferences')) {
      return this.reference
    }

    let instance = {}
    let traits

    this.objectReferences.push(instance)

    if (this.isReference('traitReferences')) {
      traits = this.reference
    } else {
      traits = {
        isExternallySerialized: this.popFlag(),
        isDynamicObject: this.popFlag(),
        sealedMemberCount: this.flags,
        className: this.readString(),
        sealedMemberNames: []
      }

      this.traitReferences.push(traits)

      if (traits.isExternallySerialized && traits.className !== '') {
        instance = new (this.byteArr.aliasMapping[traits.className])()

        if (instance.readExternal.length !== 1) {
          throw new Error(`Expecting only 1 argument for readExternal in registered class: '${traits.className}'`)
        }

        instance.readExternal(this.byteArr)
      }

      for (let i = 0; i < traits.sealedMemberCount; i++) {
        traits.sealedMemberNames[i] = this.readString()
      }
    }

    for (let i = 0; i < traits.sealedMemberCount; i++) {
      instance[traits.sealedMemberNames[i]] = this.read()
    }

    if (traits.isDynamicObject) {
      for (let key = this.readString(); key !== ''; instance[key] = this.read(), key = this.readString()) { }
    }

    if (!traits.isExternallySerialized && !traits.isDynamicObject && traits.className !== '') {
      const classObject = new (this.byteArr.aliasMapping[traits.className])()
      const values = Object.values(instance)

      for (let i = 0; i < traits.sealedMemberCount; i++) {
        classObject[traits.sealedMemberNames[i]] = values[i]
      }

      return classObject
    }

    return instance
  }

  /**
   * Write a ByteArray
   * @param {ByteArray} value
   */
  writeByteArray(value) {
    const idx = this.getReference(value, 'objectReferences')

    if (idx !== false) {
      this.writeUInt29(idx << 1)
    } else {
      this.writeUInt29((value.length << 1) | 1)

      this.byteArr.buffer = Buffer.concat([this.byteArr.buffer, value.buffer])
      this.byteArr.position += value.length

      this.writeUInt29(1)
    }
  }

  /**
   * Read a ByteArray
   * @returns {ByteArray}
   */
  readByteArray() {
    if (this.isReference('objectReferences')) {
      return this.reference
    }

    const value = new ByteArray()

    this.objectReferences.push(value)
    this.byteArr.readBytes(value, 0, this.flags)

    return value
  }

  /**
   * Write a dictionary
   * @param {Map} value
   */
  writeDictionary(value) {
    const idx = this.getReference(value, 'objectReferences')

    if (idx !== false) {
      this.writeUInt29(idx << 1)
    } else {
      this.writeUInt29((value.size << 1) | 1)
      this.byteArr.writeBoolean(false)

      for (const [k, v] of value) {
        this.write(k)
        this.write(v)
      }
    }
  }

  /**
   * Read a dictionary
   * @returns {Map}
   */
  readDictionary() {
    if (this.isReference('objectReferences')) {
      return this.reference
    }

    const length = this.flags
    const value = new Map()

    this.byteArr.position++
    this.objectReferences.push(value)

    for (let i = 0; i < length; i++) {
      value.set(this.read(), this.read())
    }

    return value
  }

  /**
   * Write a vector
   * @param {Object} value
   */
  writeVector(value) {
    const idx = this.getReference(value, 'objectReferences')

    if (idx !== false) {
      this.writeUInt29(idx << 1)
    } else {
      this.writeUInt29((value.length << 1) | 1)
      this.byteArr.writeBoolean(Object.isExtensible(value))

      for (let i = 0; i < value.length; i++) {
        this.byteArr[Util.getTypedWriteFunc(value.constructor)](value[i])
      }
    }
  }

  /**
   * Read a vector
   * @param {String} type
   * @returns {Object}
   */
  readVector(type) {
    if (this.isReference('objectReferences')) {
      return this.reference
    }

    const length = this.flags
    const fixed = this.byteArr.readBoolean()
    const value = Util.getTypedConstruct(type, length)

    for (let i = 0; i < length; i++) {
      value[i] = this.byteArr[Util.getTypedReadFunc(value.constructor)]()
    }

    return fixed ? Object.preventExtensions(value) : value
  }

  /**
   * Write a value
   * @param {*} value
   */
  write(value) {
    if (value === null) {
      this.byteArr.writeByte(Markers.NULL)
    } else if (value === undefined) {
      this.byteArr.writeByte(Markers.UNDEFINED)
    } else {
      const type = value.constructor

      if (type === Boolean) {
        this.byteArr.writeByte(value ? Markers.TRUE : Markers.FALSE)
      } else if (type === Number) {
        if (Util.isUInt29(value)) {
          this.byteArr.writeByte(Markers.INT)
          this.writeUInt29(value & 0x1FFFFFFF)
        } else {
          this.byteArr.writeByte(Markers.DOUBLE)
          this.byteArr.writeDouble(value)
        }
      } else if (type === String) {
        this.writeString(value)
      } else if (type === Date) {
        this.byteArr.writeByte(Markers.DATE)
        this.writeDate(value)
      } else if (type === Array) {
        this.byteArr.writeByte(Markers.ARRAY)
        this.writeArray(value)
      } else if (type.name === 'ByteArray') {
        this.byteArr.writeByte(Markers.BYTEARRAY)
        this.writeByteArray(value)
      } else if (type === Map) {
        this.byteArr.writeByte(Markers.DICTIONARY)
        this.writeDictionary(value)
      } else if (Util.isVectorLike(type)) {
        this.byteArr.writeByte(Markers[Util.getTypedMarkerKey(type)])
        this.writeVector(value)
      } else if (type === Object || this.byteArr.classMapping.has(type)) {
        this.byteArr.writeByte(Markers.OBJECT)
        this.writeObject(value)
      } else if (typeof value === 'object') {
        this.byteArr.writeByte(Markers.OBJECT)
        this.writeObject(Object.assign({}, value), true)
      } else if (type === BigInt) {
        this.write(value.toString())
      } else {
        throw new Error(`Unknown value type: '${type.name}'.`)
      }
    }
  }

  /**
   * Read a value
   * @returns {*}
   */
  read() {
    const marker = this.byteArr.readByte()

    switch (marker) {
      case Markers.NULL: return null
      case Markers.UNDEFINED: return undefined
      case Markers.TRUE: return true
      case Markers.FALSE: return false
      case Markers.INT: return this.readUInt29() << 3 >> 3
      case Markers.DOUBLE: return this.byteArr.readDouble()
      case Markers.STRING: return this.readString()
      case Markers.DATE: return this.readDate()
      case Markers.ARRAY: return this.readArray()
      case Markers.OBJECT: return this.readObject()
      case Markers.BYTEARRAY: return this.readByteArray()
      case Markers.DICTIONARY: return this.readDictionary()
      case Markers.VECTOR_INT: return this.readVector('int')
      case Markers.VECTOR_UINT: return this.readVector('uint')
      case Markers.VECTOR_DOUBLE: return this.readVector('double')
      default: throw new Error(`Unknown or unsupported AMF3 marker: '${marker}'.`)
    }
  }
}
