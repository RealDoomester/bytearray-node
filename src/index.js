'use strict'

/**
 * Our dependencies
 * @constant
 */
const { deflateSync, deflateRawSync, inflateSync, inflateRawSync } = require('zlib')
const { LZMA } = require('lzma-native')
const { encodingExists, decode, encode } = require('iconv-lite')

/**
 * Our enums
 * @constant
 */
const Endian = require('../enums/Endian')
const ObjectEncoding = require('../enums/ObjectEncoding')
const CompressionAlgorithm = require('../enums/CompressionAlgorithm')

/**
 * Our AMF dependencies
 * @constant
 */
const AMF0 = require('./AMF/AMF0')
const AMF3 = require('./AMF/AMF3')

/**
 * Helper function that converts data types to a buffer
 * @param {Buffer|Array|Number} v
 * @returns {Buffer}
 */
const convert = (v) => Buffer.isBuffer(v) ? v : Array.isArray(v) ? Buffer.from(v) : Number.isInteger(v) ? Buffer.alloc(v) : Buffer.alloc(0)

/**
 * @exports
 * @class
 */
module.exports = class ByteArray {
  /**
   * Used to preserve class objects
   * @static
   * @type {WeakMap}
   */
  static classMapping = new WeakMap()
  /**
   * Used to preserve alias strings
   * @static
   * @type {Object}
   */
  static aliasMapping = Object.create(null)

  /**
   * The current position
   * @private
   * @type {Number}
   */
  #position
  /**
   * The byte order
   * @private
   * @type {String}
   */
  #endian
  /**
   * The AMF object encoding
   * @private
   * @type {Number}
   */
  #objectEncoding

  /**
   * @constructor
   * @param {Buffer|Array|Number} buffer
   */
  constructor(buffer) {
    /**
     * Holds the data
     * @type {Buffer}
     */
    this.buffer = convert(buffer)
    /**
     * The current position
     * @private
     * @type {Number}
     */
    this.#position = 0
    /**
     * The byte order
     * @private
     * @type {String}
     */
    this.#endian = Endian.BIG_ENDIAN
    /**
     * The AMF object encoding
     * @private
     * @type {Number}
     */
    this.#objectEncoding = ObjectEncoding.AMF3
  }

  /**
   * Override for Object.prototype.toString.call
   * @returns {String}
   */
  get [Symbol.toStringTag]() {
    return 'ByteArray'
  }

  /**
   * Returns the current position
   * @returns {Number}
   */
  get position() {
    return this.#position
  }

  /**
   * Sets the position
   * @param {Number} value
   */
  set position(value) {
    if (Number.isInteger(value) && value >= 0) {
      this.#position = value
    } else {
      throw new TypeError(`Invalid value for position: '${value}'.`)
    }
  }

  /**
   * Returns the byte order
   * @returns {String}
   */
  get endian() {
    return this.#endian
  }

  /**
   * Sets the byte order
   * @param {String} value
   */
  set endian(value) {
    if (value === 'LE' || value === 'BE') {
      this.#endian = value
    } else {
      throw new TypeError(`Invalid value for endian: '${value}'.`)
    }
  }

  /**
   * Returns the AMF object encoding
   * @returns {Number}
   */
  get objectEncoding() {
    return this.#objectEncoding
  }

  /**
   * Sets the AMF object encoding
   * @param {Number} value
   */
  set objectEncoding(value) {
    if (Number.isInteger(value) && value === 0 || value === 3) {
      this.#objectEncoding = value
    } else {
      throw new TypeError(`Invalid value for objectEncoding: '${value}'.`)
    }
  }

  /**
   * Returns the length of the buffer
   * @returns {Number}
   */
  get length() {
    return this.buffer.length
  }

  /**
   * Sets the length of the buffer
   * @param {Number} value
   */
  set length(value) {
    if (!Number.isInteger(value) || value < 0) {
      throw new TypeError(`Invalid value for length: '${value}'.`)
    }

    if (value === 0) {
      this.clear()
    } else if (value !== this.length) {
      if (value < this.length) {
        this.buffer = this.buffer.slice(0, value)
        this.position = this.length
      } else {
        this.expand(value)
      }
    }
  }

  /**
   * Returns the amount of bytes available
   * @returns {Number}
   */
  get bytesAvailable() {
    return this.length - this.position
  }

  /**
   * Returns the class mapping
   * @returns {WeakMap}
   */
  get classMapping() {
    return ByteArray.classMapping
  }

  /**
   * Returns the alias mapping
   * @returns {Object}
   */
  get aliasMapping() {
    return ByteArray.aliasMapping
  }

  /**
   * Preserves the class (type) of an object when the object is encoded in AMF
   * @param {String} aliasName
   * @param {Object} classObject
   */
  static registerClassAlias(aliasName, classObject) {
    if (!aliasName) {
      throw new Error('Missing alias name.')
    }

    if (!classObject) {
      throw new Error('Missing class object.')
    }

    this.classMapping.set(classObject, aliasName)
    this.aliasMapping[aliasName] = classObject
  }

  /**
   * Reads a buffer function
   * @param {String} func
   * @param {Number} pos
   * @returns {Number}
   */
  readBufferFunc(func, pos) {
    const value = this.buffer[`${func}${this.endian}`](this.position)

    this.position += pos

    return value
  }

  /**
   * Writes a buffer function
   * @param {Number} value
   * @param {String} func
   * @param {Number} pos
   */
  writeBufferFunc(value, func, pos) {
    this.expand(pos)

    this.buffer[`${func}${this.endian}`](value, this.position)
    this.position += pos
  }

  /**
   * Expands the buffer when needed
   * @param {Number} value
   */
  expand(value) {
    if (this.bytesAvailable < value) {
      const old = this.buffer
      const size = old.length + (value - this.bytesAvailable)

      this.buffer = Buffer.alloc(size)
      old.copy(this.buffer)
    }
  }

  /**
   * Simulates signed overflow
   * @author truelossless
   * @param {Number} value
   * @param {Number} bits
   * @returns {Number}
   */
  signedOverflow(value, bits) {
    const sign = 1 << bits - 1

    return (value & sign - 1) - (value & sign)
  }

  /**
   * Clears the buffer and sets the position to 0
   */
  clear() {
    this.buffer = Buffer.alloc(0)
    this.position = 0
  }

  /**
   * Compresses the buffer
   * @param {String} [algorithm=CompressionAlgorithm.ZLIB]
   */
  async compress(algorithm = CompressionAlgorithm.ZLIB) {
    if (this.length === 0) {
      return
    }

    algorithm = algorithm.toLowerCase()

    if (algorithm === CompressionAlgorithm.ZLIB) {
      this.buffer = deflateSync(this.buffer, { level: 9 })
    } else if (algorithm === CompressionAlgorithm.DEFLATE) {
      this.buffer = deflateRawSync(this.buffer)
    } else if (algorithm === CompressionAlgorithm.LZMA) {
      this.buffer = await LZMA().compress(this.buffer, 1)
    } else {
      throw new Error(`Invalid compression algorithm: '${algorithm}'.`)
    }

    this.position = this.length
  }

  /**
   * Reads a boolean
   * @returns {Boolean}
   */
  readBoolean() {
    return this.readByte() !== 0
  }

  /**
   * Reads a signed byte
   * @returns {Number}
   */
  readByte() {
    return this.buffer.readInt8(this.position++)
  }

  /**
   * Reads multiple signed bytes from a ByteArray
   * @param {ByteArray} bytes
   * @param {Number} [offset=0]
   * @param {Number} [length=0]
   */
  readBytes(bytes, offset = 0, length = 0) {
    if (length === 0) {
      length = this.bytesAvailable
    }

    if (length > this.bytesAvailable) {
      throw new RangeError('End of buffer was encountered.')
    }

    if (bytes.length < offset + length) {
      bytes.expand(offset + length)
    }

    for (let i = 0; i < length; i++) {
      bytes.buffer[i + offset] = this.buffer[i + this.position]
    }

    this.position += length
  }

  /**
   * Reads a double
   * @returns {Number}
   */
  readDouble() {
    return this.readBufferFunc('readDouble', 8)
  }

  /**
   * Reads a float
   * @returns {Number}
   */
  readFloat() {
    return this.readBufferFunc('readFloat', 4)
  }

  /**
   * Reads a signed int
   * @returns {Number}
   */
  readInt() {
    return this.readBufferFunc('readInt32', 4)
  }

  /**
   * Reads a signed long
   * @returns {BigInt}
   */
  readLong() {
    return this.readBufferFunc('readBigInt64', 8)
  }

  /**
   * Reads a multibyte string
   * @param {Number} length
   * @param {String} [charset='utf8']
   * @returns {String}
   */
  readMultiByte(length, charset = 'utf8') {
    const position = this.position
    this.position += length

    if (encodingExists(charset)) {
      const b = this.buffer.slice(position, this.position)
      const stripBOM = (charset === 'utf8' || charset === 'utf-8') && b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF
      const value = decode(b, charset, { stripBOM })

      stripBOM ? length -= 3 : 0

      if (Buffer.byteLength(value) !== length) {
        throw new RangeError('End of buffer was encountered.')
      }

      return value
    } else {
      throw new Error(`Invalid character set: '${charset}'.`)
    }
  }

  /**
   * Reads an object
   * @returns {*}
   */
  readObject() {
    if (this.objectEncoding === ObjectEncoding.AMF0) {
      return new AMF0(this).read()
    } else if (this.objectEncoding === ObjectEncoding.AMF3) {
      return new AMF3(this).read()
    } else {
      throw new Error(`Unknown object encoding: '${this.objectEncoding}'.`)
    }
  }

  /**
   * Reads a signed short
   * @returns {Number}
   */
  readShort() {
    return this.readBufferFunc('readInt16', 2)
  }

  /**
   * Reads an unsigned byte
   * @returns {Number}
   */
  readUnsignedByte() {
    return this.buffer.readUInt8(this.position++)
  }

  /**
   * Reads an unsigned int
   * @returns {Number}
   */
  readUnsignedInt() {
    return this.readBufferFunc('readUInt32', 4)
  }

  /**
   * Reads an unsigned short
   * @returns {Number}
   */
  readUnsignedShort() {
    return this.readBufferFunc('readUInt16', 2)
  }

  /**
   * Reads an unsigned long
   * @returns {BigInt}
   */
  readUnsignedLong() {
    return this.readBufferFunc('readBigUInt64', 8)
  }

  /**
   * Reads a UTF-8 string
   * @returns {String}
   */
  readUTF() {
    return this.readMultiByte(this.readUnsignedShort())
  }

  /**
   * Reads UTF-8 bytes
   * @param {Number} length
   * @returns {String}
   */
  readUTFBytes(length) {
    return this.readMultiByte(length)
  }

  /**
   * Converts the buffer to JSON
   * @returns {Object}
   */
  toJSON() {
    return Object.assign({}, this.buffer.toJSON().data)
  }

  /**
   * Converts the buffer to a string
   * @param {String} [charset='utf8']
   * @returns {String}
   */
  toString(charset = 'utf8') {
    if (encodingExists(charset)) {
      return decode(this.buffer, charset)
    } else {
      throw new Error(`Invalid character set: '${charset}'.`)
    }
  }

  /**
   * Decompresses the buffer
   * @param {String} [algorithm=CompressionAlgorithm.ZLIB]
   */
  async uncompress(algorithm = CompressionAlgorithm.ZLIB) {
    if (this.length === 0) {
      return
    }

    algorithm = algorithm.toLowerCase()

    if (algorithm === CompressionAlgorithm.ZLIB) {
      this.buffer = inflateSync(this.buffer, { level: 9 })
    } else if (algorithm === CompressionAlgorithm.DEFLATE) {
      this.buffer = inflateRawSync(this.buffer)
    } else if (algorithm === CompressionAlgorithm.LZMA) {
      this.buffer = await LZMA().decompress(this.buffer)
    } else {
      throw new Error(`Invalid decompression algorithm: '${algorithm}'.`)
    }

    this.position = 0
  }

  /**
   * Writes a boolean
   * @param {Boolean} value
   */
  writeBoolean(value) {
    this.writeByte(value ? 1 : 0)
  }

  /**
   * Writes a signed byte
   * @param {Number} value
   */
  writeByte(value) {
    this.expand(1)
    this.buffer.writeInt8(this.signedOverflow(value, 8), this.position++)
  }

  /**
   * Writes multiple signed bytes to a ByteArray
   * @param {ByteArray} bytes
   * @param {Number} [offset=0]
   * @param {Number} [length=0]
   */
  writeBytes(bytes, offset = 0, length = 0) {
    if (length === 0) {
      length = bytes.length - offset
    }

    this.expand(length)

    for (let i = 0; i < length; i++) {
      this.buffer[i + this.position] = bytes.buffer[i + offset]
    }

    this.position += length
  }

  /**
  * Writes a double
  * @param {Number} value
  */
  writeDouble(value) {
    this.writeBufferFunc(value, 'writeDouble', 8)
  }

  /**
   * Writes a float
   * @param {Number} value
   */
  writeFloat(value) {
    this.writeBufferFunc(value, 'writeFloat', 4)
  }

  /**
   * Writes a signed int
   * @param {Number} value
   */
  writeInt(value) {
    this.writeBufferFunc(this.signedOverflow(value, 32), 'writeInt32', 4)
  }

  /**
   * Writes a signed long
   * @param {BigInt} value
   */
  writeLong(value) {
    this.writeBufferFunc(value, 'writeBigInt64', 8)
  }

  /**
   * Writes a multibyte string
   * @param {String} value
   * @param {String} [charset='utf8']
   */
  writeMultiByte(value, charset = 'utf8') {
    this.position += Buffer.byteLength(value)

    if (encodingExists(charset)) {
      this.buffer = Buffer.concat([this.buffer, encode(value, charset)])
    } else {
      throw new Error(`Invalid character set: '${charset}'.`)
    }
  }

  /**
   * Writes an object
   * @param {*} value
   */
  writeObject(value) {
    if (this.objectEncoding === ObjectEncoding.AMF0) {
      new AMF0(this).write(value)
    } else if (this.objectEncoding === ObjectEncoding.AMF3) {
      new AMF3(this).write(value)
    } else {
      throw new Error(`Unknown object encoding: '${this.objectEncoding}'.`)
    }
  }

  /**
   * Writes a signed short
   * @param {Number} value
   */
  writeShort(value) {
    this.writeBufferFunc(this.signedOverflow(value, 16), 'writeInt16', 2)
  }

  /**
   * Writes an unsigned byte
   * @param {Number} value
   */
  writeUnsignedByte(value) {
    this.expand(1)
    this.buffer.writeUInt8(value, this.position++)
  }

  /**
   * Writes an unsigned int
   * @param {Number} value
   */
  writeUnsignedInt(value) {
    this.writeBufferFunc(value, 'writeUInt32', 4)
  }

  /**
   * Writes an unsigned short
   * @param {Number} value
   */
  writeUnsignedShort(value) {
    this.writeBufferFunc(value, 'writeUInt16', 2)
  }

  /**
   * Writes an unsigned long
   * @param {BigInt} value
   */
  writeUnsignedLong(value) {
    this.writeBufferFunc(value, 'writeBigUInt64', 8)
  }

  /**
   * Writes a UTF-8 string
   * @param {String} value
   */
  writeUTF(value) {
    this.writeUnsignedShort(Buffer.byteLength(value))
    this.writeMultiByte(value)
  }

  /**
   * Writes UTF-8 bytes
   * @param {String} value
   */
  writeUTFBytes(value) {
    this.writeMultiByte(value)
  }
}
