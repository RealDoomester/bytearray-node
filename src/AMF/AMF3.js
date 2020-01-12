'use strict'

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
  OBJECT: 0x0A
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
     * The flags
     * @type {Number}
     */
    this.flags = 0
    /**
     * The reference
     * @type {*}
     */
    this.reference = null
    /**
     * The array of string references
     * @type {Array<String>}
     */
    this.stringReferences = []
    /**
     * The array of object references
     * @type {Array<Object>}
     */
    this.objectReferences = []
    /**
     * The array of trait references
     * @type {Array<Object>}
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
   * @returns {Number}
   */
  popFlag() {
    const ref = this.flags & 1

    this.flags >>= 1

    return ref
  }

  /**
   * Set the current reference
   * @param {String} table
   * @returns {Boolean}
   */
  isReference(table) {
    this.reference = null

    if (table !== 'traitReferences') {
      this.flags = this.readUInt29()
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
    }

    this[table].push(value)

    return false
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
      if (Object.keys(value).length === value.length) {
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

    const denseCount = this.flags

    let finalArr
    let associativeCount = 0

    while (true) {
      const key = this.readString()

      if (!key) {
        break
      }

      associativeCount++

      if (associativeCount === 1) {
        finalArr = {}

        this.objectReferences.push(finalArr)
      }

      finalArr[key] = this.read()
    }

    if (associativeCount === 0) {
      finalArr = []

      this.objectReferences.push(finalArr)
    }

    for (let i = 0; i < denseCount; i++) {
      finalArr[i] = this.read()
    }

    return finalArr
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
        if (value << 3 >> 3 === value) {
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
      default: throw new Error(`Unknown or unsupported AMF3 marker: '${marker}'.`)
    }
  }
}
