'use strict'

const { deflateSync, deflateRawSync, inflateSync, inflateRawSync } = require('zlib')
const { LZMA } = require('lzma-native')
const { encodingExists, decode, encode } = require('iconv-lite')

const { CompressionAlgorithm, Endian, ObjectEncoding } = require('../enums/')

const { AMF0 } = require('amf0-ts')
const { AMF3 } = require('amf3-ts')

/**
 * @description Helper function that converts data types to a buffer
 * @param {Buffer|Array|Number} v
 * @returns {Buffer}
 */
const convert = (v) => Buffer.isBuffer(v)
  ? v
  : Array.isArray(v)
    ? Buffer.from(v)
    : Number.isInteger(v)
      ? Buffer.alloc(v)
      : Buffer.alloc(0)

/**
 * @exports
 * @class
 */
module.exports = class ByteArray {
  /**
   * @private
   * @description The current position
   * @type {Number}
   */
  #position
  /**
   * @private
   * @description The byte order
   * @type {String}
   */
  #endian
  /**
   * @private
   * @description The object encoding
   * @type {Number}
   */
  #objectEncoding

  /**
   * @constructor
   * @param {Buffer|Array|Number} buffer
   */
  constructor(buffer) {
    /**
     * @description Holds the data
     * @type {Buffer}
     */
    this.buffer = convert(buffer)
    /**
     * @private
     * @description The current position
     * @type {Number}
     */
    this.#position = 0
    /**
     * @private
     * @description The byte order
     * @type {String}
     */
    this.#endian = Endian.BIG_ENDIAN
    /**
     * @private
     * @description The object encoding
     * @type {Number}
     */
    this.#objectEncoding = ObjectEncoding.AMF3
  }

  /**
   * @static
   * @description Registers a class alias
   * @param {String} aliasName
   * @param {ObjectEncoding} classObject
   */
  static registerClassAlias(aliasName, classObject) {
    AMF0.registerClassAlias(aliasName, classObject)
    AMF3.registerClassAlias(aliasName, classObject)
  }

  /**
   * @description Override for Object.prototype.toString.call
   * @returns {String}
   */
  get [Symbol.toStringTag]() {
    return 'ByteArray'
  }

  /**
   * @description Returns the current position
   * @returns {Number}
   */
  get position() {
    return this.#position
  }

  /**
   * @description Sets the position
   * @param {Number} value
   */
  set position(value) {
    if (value >= 0) {
      this.#position = value
    } else {
      throw new TypeError(`Invalid value for position: '${value}'.`)
    }
  }

  /**
   * @description Returns the byte order
   * @returns {String}
   */
  get endian() {
    return this.#endian
  }

  /**
   * @description Sets the byte order
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
   * @description Returns the object encoding
   * @returns {Number}
   */
  get objectEncoding() {
    return this.#objectEncoding
  }

  /**
   * @description Sets the object encoding
   * @param {Number} encoding
   */
  set objectEncoding(encoding) {
    if (encoding === ObjectEncoding.AMF0 || encoding === ObjectEncoding.AMF3) {
      this.#objectEncoding = encoding
    } else {
      throw new Error(`Unknown object encoding: '${encoding}'.`)
    }
  }

  /**
   * @description Returns the length of the buffer
   * @returns {Number}
   */
  get length() {
    return this.buffer.length
  }

  /**
   * @description Sets the length of the buffer
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
        this.#position = this.length
      } else {
        this.#expand(value)
      }
    }
  }

  /**
   * @description Returns the amount of bytes available
   * @returns {Number}
   */
  get bytesAvailable() {
    return this.length - this.#position
  }

  /**
   * @private
   * @description Reads a buffer function
   * @param {String} func
   * @param {Number} pos
   * @returns {Number}
   */
  #readBufferFunc(func, pos) {
    const value = this.buffer[`${func}${this.#endian}`](this.#position)

    this.#position += pos

    return value
  }

  /**
   * @private
   * @description Writes a buffer function
   * @param {Number} value
   * @param {String} func
   * @param {Number} pos
   */
  #writeBufferFunc(value, func, pos) {
    this.#expand(pos)

    this.buffer[`${func}${this.#endian}`](value, this.#position)
    this.#position += pos
  }

  /**
   * @private
   * @description Expands the buffer when needed
   * @param {Number} value
   */
  #expand(value) {
    if (this.bytesAvailable < value) {
      const old = this.buffer
      const size = old.length + (value - this.bytesAvailable)

      this.buffer = Buffer.alloc(size)
      old.copy(this.buffer)
    }
  }

  /**
   * @description Simulates signed overflow
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
   * @description Clears the buffer and sets the position to 0
   */
  clear() {
    this.buffer = Buffer.alloc(0)
    this.#position = 0
  }

  /**
   * @description Compresses the buffer
   * @param {String} algorithm
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

    this.#position = this.length
  }

  /**
   * @description Reads a boolean
   * @returns {Boolean}
   */
  readBoolean() {
    return this.readByte() !== 0
  }

  /**
   * @description Reads a signed byte
   * @returns {Number}
   */
  readByte() {
    return this.buffer.readInt8(this.#position++)
  }

  /**
   * @description Reads multiple signed bytes from a ByteArray
   * @param {ByteArray} bytes
   * @param {Number} offset
   * @param {Number} length
   */
  readBytes(bytes, offset = 0, length = 0) {
    if (length === 0) {
      length = this.bytesAvailable
    }

    if (length > this.bytesAvailable) {
      throw new RangeError('End of buffer was encountered.')
    }

    if (bytes.length < offset + length) {
      bytes.#expand(offset + length)
    }

    for (let i = 0; i < length; i++) {
      bytes.buffer[i + offset] = this.buffer[i + this.#position]
    }

    this.#position += length
  }

  /**
   * @description Reads a double
   * @returns {Number}
   */
  readDouble() {
    return this.#readBufferFunc('readDouble', 8)
  }

  /**
   * @description Reads a float
   * @returns {Number}
   */
  readFloat() {
    return this.#readBufferFunc('readFloat', 4)
  }

  /**
   * @description Reads a signed int
   * @returns {Number}
   */
  readInt() {
    return this.#readBufferFunc('readInt32', 4)
  }

  /**
   * @description Reads a signed long
   * @returns {BigInt}
   */
  readLong() {
    return this.#readBufferFunc('readBigInt64', 8)
  }

  /**
   * @description Reads a multibyte string
   * @param {Number} length
   * @param {String} charset
   * @returns {String}
   */
  readMultiByte(length, charset = 'utf8') {
    const position = this.#position
    this.#position += length

    if (encodingExists(charset)) {
      const b = this.buffer.slice(position, this.#position)
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
   * @description Reads an object
   * @returns {Object}
   */
  readObject() {
    const [position, value] = this.#objectEncoding === ObjectEncoding.AMF0
      ? AMF0.parse(this.buffer, this.#position)
      : AMF3.parse(this.buffer, this.#position)

    this.#position += position

    return value
  }

  /**
   * @description Reads a signed short
   * @returns {Number}
   */
  readShort() {
    return this.#readBufferFunc('readInt16', 2)
  }

  /**
   * @description Reads an unsigned byte
   * @returns {Number}
   */
  readUnsignedByte() {
    return this.buffer.readUInt8(this.#position++)
  }

  /**
   * @description Reads an unsigned int
   * @returns {Number}
   */
  readUnsignedInt() {
    return this.#readBufferFunc('readUInt32', 4)
  }

  /**
   * @description Reads an unsigned short
   * @returns {Number}
   */
  readUnsignedShort() {
    return this.#readBufferFunc('readUInt16', 2)
  }

  /**
   * @description Reads an unsigned long
   * @returns {BigInt}
   */
  readUnsignedLong() {
    return this.#readBufferFunc('readBigUInt64', 8)
  }

  /**
   * @description Reads a UTF-8 string
   * @returns {String}
   */
  readUTF() {
    return this.readMultiByte(this.readUnsignedShort())
  }

  /**
   * @description Reads UTF-8 bytes
   * @param {Number} length
   * @returns {String}
   */
  readUTFBytes(length) {
    return this.readMultiByte(length)
  }

  /**
   * @description Converts the buffer to JSON
   * @returns {Object}
   */
  toJSON() {
    return Object.assign({}, this.buffer.toJSON().data)
  }

  /**
   * @description Converts the buffer to a string
   * @param {String} charset
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
   * @description Decompresses the buffer
   * @param {String} algorithm
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

    this.#position = 0
  }

  /**
   * @description Writes a boolean
   * @param {Boolean} value
   */
  writeBoolean(value) {
    this.writeByte(value ? 1 : 0)
  }

  /**
   * @description Writes a signed byte
   * @param {Number} value
   */
  writeByte(value) {
    this.#expand(1)
    this.buffer.writeInt8(this.signedOverflow(value, 8), this.#position++)
  }

  /**
   * @description Writes multiple signed bytes to a ByteArray
   * @param {ByteArray} bytes
   * @param {Number} offset
   * @param {Number} length
   */
  writeBytes(bytes, offset = 0, length = 0) {
    if (length === 0) {
      length = bytes.length - offset
    }

    this.#expand(length)

    for (let i = 0; i < length; i++) {
      this.buffer[i + this.#position] = bytes.buffer[i + offset]
    }

    this.#position += length
  }

  /**
  * @description Writes a double
  * @param {Number} value
  */
  writeDouble(value) {
    this.#writeBufferFunc(value, 'writeDouble', 8)
  }

  /**
   * @description Writes a float
   * @param {Number} value
   */
  writeFloat(value) {
    this.#writeBufferFunc(value, 'writeFloat', 4)
  }

  /**
   * @description Writes a signed int
   * @param {Number} value
   */
  writeInt(value) {
    this.#writeBufferFunc(this.signedOverflow(value, 32), 'writeInt32', 4)
  }

  /**
   * @description Writes a signed long
   * @param {BigInt} value
   */
  writeLong(value) {
    this.#writeBufferFunc(value, 'writeBigInt64', 8)
  }

  /**
   * @description Writes a multibyte string
   * @param {String} value
   * @param {String} charset
   */
  writeMultiByte(value, charset = 'utf8') {
    this.#position += Buffer.byteLength(value)

    if (encodingExists(charset)) {
      this.buffer = Buffer.concat([this.buffer, encode(value, charset)])
    } else {
      throw new Error(`Invalid character set: '${charset}'.`)
    }
  }

  /**
   * @description Writes an object
   * @param {Object} value
   */
  writeObject(value) {
    const bytes = this.#objectEncoding === ObjectEncoding.AMF0
      ? AMF0.stringify(value)
      : AMF3.stringify(value)

    this.#position += bytes.length
    this.buffer = Buffer.concat([this.buffer, Buffer.from(bytes)])
  }

  /**
   * @description Writes a signed short
   * @param {Number} value
   */
  writeShort(value) {
    this.#writeBufferFunc(this.signedOverflow(value, 16), 'writeInt16', 2)
  }

  /**
   * @description Writes an unsigned byte
   * @param {Number} value
   */
  writeUnsignedByte(value) {
    this.#expand(1)
    this.buffer.writeUInt8(value, this.#position++)
  }

  /**
   * @description Writes an unsigned int
   * @param {Number} value
   */
  writeUnsignedInt(value) {
    this.#writeBufferFunc(value, 'writeUInt32', 4)
  }

  /**
   * @description Writes an unsigned short
   * @param {Number} value
   */
  writeUnsignedShort(value) {
    this.#writeBufferFunc(value, 'writeUInt16', 2)
  }

  /**
   * @description Writes an unsigned long
   * @param {BigInt} value
   */
  writeUnsignedLong(value) {
    this.#writeBufferFunc(value, 'writeBigUInt64', 8)
  }

  /**
   * @description Writes a UTF-8 string
   * @param {String} value
   */
  writeUTF(value) {
    this.writeUnsignedShort(Buffer.byteLength(value))
    this.writeMultiByte(value)
  }

  /**
   * @description Writes UTF-8 bytes
   * @param {String} value
   */
  writeUTFBytes(value) {
    this.writeMultiByte(value)
  }
}
