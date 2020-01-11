'use strict'

/**
 * The AMF0 markers
 * @constant
 */
const Markers = {
  NUMBER: 0x00,
  BOOLEAN: 0x01,
  STRING: 0x02,
  OBJECT: 0x03,
  NULL: 0x05,
  UNDEFINED: 0x06,
  REFERENCE: 0x07,
  ECMA_ARRAY: 0x08,
  OBJECT_END: 0x09,
  DATE: 0x0B,
  LONG_STRING: 0x0C,
  TYPED_OBJECT: 0x10
}

/**
 * @exports
 * @class
 */
module.exports = class AMF0 {
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
     * The array of object references
     * @type {Array<Object>}
     */
    this.references = []
  }

  /**
   * Get or set a reference
   * @param {Object} value
   * @returns {Number|Boolean}
   */
  getReference(value) {
    const idx = this.references.indexOf(value)

    if (idx >= 0) {
      return idx
    }

    this.references.push(value)

    return false
  }

  /**
   * Write a reference
   * @param {Number} idx
   */
  writeReference(idx) {
    this.byteArr.writeByte(Markers.REFERENCE)
    this.byteArr.writeUnsignedShort(idx)
  }

  /**
   * Write the end of an object
   */
  writeObjectEnd() {
    this.byteArr.writeShort(0)
    this.byteArr.writeByte(Markers.OBJECT_END)
  }

  /**
   * Read the end of an object
   * @param {Object} obj
   * @returns {Object}
   */
  readObjectEnd(obj) {
    if (this.byteArr.readByte() === Markers.OBJECT_END) {
      return obj
    } else {
      throw new Error('Invalid object end marker found.')
    }
  }

  /**
   * Write a string
   * @param {String} value
   * @param {Boolean} useType
   */
  writeString(value, useType = true) {
    const isLong = value.length > 65535

    if (useType) {
      this.byteArr.writeByte(isLong ? Markers.LONG_STRING : Markers.STRING)
    }

    isLong ? this.byteArr.writeUnsignedInt(value.length) : this.byteArr.writeUnsignedShort(value.length)

    this.byteArr.writeUTFBytes(value)
  }

  /**
   * Write an object
   * @param {Object} value
   */
  writeObject(value) {
    const idx = this.getReference(value)

    if (idx !== false) {
      return this.writeReference(idx)
    }

    this.byteArr.writeByte(Markers.OBJECT)

    for (const key in value) {
      this.writeString(key, false)
      this.write(value[key])
    }

    this.writeObjectEnd()
  }

  /**
   * Read an object
   * @returns {Object}
   */
  readObject() {
    const obj = {}

    this.references.push(obj)

    for (let key = this.byteArr.readUTF(); key !== ''; obj[key] = this.read(), key = this.byteArr.readUTF()) { }

    return this.readObjectEnd(obj)
  }

  /**
   * Write an ECMA array
   * @param {Array} value
   */
  writeECMAArray(value) {
    const idx = this.getReference(value)

    if (idx !== false) {
      return this.writeReference(idx)
    }

    this.byteArr.writeByte(Markers.ECMA_ARRAY)
    this.byteArr.writeUnsignedInt(Object.keys(value).length)

    for (const i in value) {
      this.writeString(String(i), false)
      this.write(value[i])
    }

    this.writeObjectEnd()
  }

  /**
   * Read an ECMA array
   * @returns {Array}
   */
  readECMAArray() {
    const arr = []
    const length = this.byteArr.readUnsignedInt()

    this.references.push(arr)

    for (let i = 0; i < length; i++) {
      arr[this.byteArr.readUTF()] = this.read()
    }

    if (this.byteArr.readShort() === 0) {
      return this.readObjectEnd(arr)
    } else {
      throw new Error('Invalid object end string found.')
    }
  }

  /**
   * Write a date
   * @param {Date} value
   */
  writeDate(value) {
    const idx = this.getReference(value)

    if (idx !== false) {
      return this.writeReference(idx)
    }

    this.byteArr.writeByte(Markers.DATE)
    this.byteArr.writeDouble(value.getTime())
    this.byteArr.writeShort(value.getTimezoneOffset())
  }

  /**
   * Read a date
   * @returns {Date}
   */
  readDate() {
    const date = new Date(this.byteArr.readDouble())

    this.byteArr.readShort()
    this.references.push(date)

    return date
  }

  /**
   * Write a typed object
   * @param {Object} value
   */
  writeTypedObject(value) {
    const idx = this.getReference(value)

    if (idx !== false) {
      return this.writeReference(idx)
    }

    this.byteArr.writeByte(Markers.TYPED_OBJECT)
    this.byteArr.writeUTF(this.byteArr.classMapping[value.constructor])

    for (const key in value) {
      this.writeString(key, false)
      this.write(value[key])
    }

    this.writeObjectEnd()
  }

  /**
   * Read a typed object
   * @returns {Object}
   */
  readTypedObject() {
    let obj = {}
    const className = this.byteArr.readUTF()

    if (!this.byteArr.aliasMapping[className]) {
      throw new Error(`The classname: '${className}' is not registered.`)
    }

    const classObject = this.byteArr.aliasMapping[className]

    this.references.push(obj)

    obj = new classObject()

    for (let key = this.byteArr.readUTF(); key !== ''; obj[key] = this.read(), key = this.byteArr.readUTF()) { }

    return this.readObjectEnd(obj)
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
        this.byteArr.writeByte(Markers.BOOLEAN)
        this.byteArr.writeBoolean(value)
      } else if (type === Number) {
        this.byteArr.writeByte(Markers.NUMBER)
        this.byteArr.writeDouble(value)
      } else if (type === String) {
        this.writeString(value)
      } else if (type === Object) {
        this.writeObject(value)
      } else if (type === Array) {
        this.writeECMAArray(value)
      } else if (type === Date) {
        this.writeDate(value)
      } else if (this.byteArr.classMapping[type]) {
        this.writeTypedObject(value)
      } else if (typeof value === 'object') {
        this.write(Object.assign({}, value))
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
      case Markers.BOOLEAN: return this.byteArr.readBoolean()
      case Markers.NUMBER: return this.byteArr.readDouble()
      case Markers.STRING: return this.byteArr.readUTF()
      case Markers.LONG_STRING: return this.byteArr.readUTFBytes(this.byteArr.readUnsignedInt())
      case Markers.REFERENCE: return this.references[this.byteArr.readUnsignedShort()]
      case Markers.OBJECT: return this.readObject()
      case Markers.ECMA_ARRAY: return this.readECMAArray()
      case Markers.DATE: return this.readDate()
      case Markers.TYPED_OBJECT: return this.readTypedObject()
      default: throw new Error(`Unknown or unsupported AMF0 marker: '${marker}'.`)
    }
  }
}
