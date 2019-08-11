'use strict'

const { deflateSync, deflateRawSync, inflateSync, inflateRawSync } = require('zlib')
const { encodingExists, decode, encode } = require('iconv-lite')

/**
 * @exports
 * @class
 */
module.exports = class ByteArray {
  /**
   * @constructor
   * @param {Buffer|Array} buffer
   */
  constructor(buffer) {
    /**
     * Holds the data
     * @type {Buffer}
     */
    this.buffer = Buffer.isBuffer(buffer) ? buffer : Array.isArray(buffer) ? Buffer.from(buffer) : Buffer.alloc(0)
    /**
     * The current position
     * @type {Number}
     */
    this.position = 0
    /**
     * The byte order
     * @type {Boolean}
     */
    this.endian = true
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
    if (value === 0) {
      this.clear()
    } else if (value !== this.length) {
      if (value < this.length) {
        this.buffer = this.buffer.slice(0, value)
        this.position = this.length
      } else {
        this.expand(this.position !== 0 ? value - this.position : value)
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
   * Expands the buffer when needed
   * @param {Number} value
   */
  expand(value) {
    if (this.bytesAvailable >= value) {
      return
    }

    const toExpand = Math.abs(this.bytesAvailable - value)

    if (this.bytesAvailable + toExpand === value) {
      this.buffer = Buffer.concat([this.buffer, Buffer.alloc(toExpand)])
    } else {
      this.buffer = Buffer.concat([this.buffer, Buffer.alloc(value)])
    }
  }

  /**
   * Clears the buffer and resets the length and position to 0
   */
  clear() {
    this.buffer = Buffer.alloc(0)
    this.position = 0
  }

  /**
   * Compresses the buffer
   * @param {String} algorithm
   */
  compress(algorithm) {
    switch (algorithm.toLowerCase()) {
      case 'zlib': this.buffer = deflateSync(this.buffer, { level: 9 }); break
      case 'deflate': this.buffer = deflateRawSync(this.buffer); break
      default: throw new Error(`Invalid compression algorithm: ${algorithm}`)
    }

    this.position = this.length
  }

  /**
   * Compresses the buffer using deflate
   */
  deflate() {
    this.compress('deflate')
  }

  /**
   * Decompresses the buffer using deflate
   */
  inflate() {
    this.uncompress('deflate')
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
   * @param {Number} offset
   * @param {Number} length
   */
  readBytes(bytes, offset = 0, length = 0) {
    const available = this.bytesAvailable

    if (length === 0) {
      length = available
    }

    if (length > available) {
      throw new RangeError('End of file was encountered')
    }

    if (bytes.length < offset + length) {
      bytes.expand(offset + length - bytes.position)
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
    const value = this.endian ? this.buffer.readDoubleBE(this.position) : this.buffer.readDoubleLE(this.position)
    this.position += 8
    return value
  }

  /**
   * Reads a float
   * @returns {Number}
   */
  readFloat() {
    const value = this.endian ? this.buffer.readFloatBE(this.position) : this.buffer.readFloatLE(this.position)
    this.position += 4
    return value
  }

  /**
   * Reads a signed int
   * @returns {Number}
   */
  readInt() {
    const value = this.endian ? this.buffer.readInt32BE(this.position) : this.buffer.readInt32LE(this.position)
    this.position += 4
    return value
  }

  /**
   * Reads a multibyte string
   * @param {Length} length
   * @param {String} charSet
   * @returns {String}
   */
  readMultiByte(length, charSet = 'utf8') {
    const position = this.position
    this.position += length

    if (encodingExists(charSet)) {
      return decode(this.buffer.slice(position, position + length), charSet)
    } else {
      throw new Error(`Invalid character set: ${charSet}`)
    }
  }

  /**
   * Reads a signed short
   * @returns {Number}
   */
  readShort() {
    const value = this.endian ? this.buffer.readInt16BE(this.position) : this.buffer.readInt16LE(this.position)
    this.position += 2
    return value
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
    const value = this.endian ? this.buffer.readUInt32BE(this.position) : this.buffer.readUInt32LE(this.position)
    this.position += 4
    return value
  }

  /**
   * Reads an unsigned short
   * @returns {Number}
   */
  readUnsignedShort() {
    const value = this.endian ? this.buffer.readUInt16BE(this.position) : this.buffer.readUInt16LE(this.position)
    this.position += 2
    return value
  }

  /**
   * Reads a UTF-8 string
   * @returns {String}
   */
  readUTF() {
    return this.readMultiByte(this.readUnsignedShort())
  }

  /**
   * Reads multiple UTF-8 bytes
   * @param {Number} length
   * @returns {String}
   */
  readUTFBytes(length) {
    return this.readMultiByte(length)
  }

  /**
   * Converts the buffer to JSON
   * @returns {JSON}
   */
  toJSON() {
    return this.buffer.toJSON()
  }

  /**
   * Converts the buffer to a string
   * @returns {String}
   */
  toString() {
    return this.buffer.toString('utf8')
  }

  /**
   * Decompresses the buffer
   * @param {String} algorithm
   */
  uncompress(algorithm) {
    switch (algorithm.toLowerCase()) {
      case 'zlib': this.buffer = inflateSync(this.buffer, { level: 9 }); break
      case 'deflate': this.buffer = inflateRawSync(this.buffer); break
      default: throw new Error(`Invalid compression algorithm: ${algorithm}`)
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
    this.buffer.writeInt8(value, this.position++)
  }

  /**
   * Writes multiple signed bytes to a ByteArray
   * @param {ByteArray} bytes
   * @param {Number} offset
   * @param {Number} length
   */
  writeBytes(bytes, offset = 0, length = 0) {
    if (length === 0) {
      length = bytes.length - offset
    }

    this.expand(this.position + length - this.position)

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
    this.expand(8)
    this.endian ? this.buffer.writeDoubleBE(value, this.position) : this.buffer.writeDoubleLE(value, this.position)
    this.position += 8
  }

  /**
   * Writes a float
   * @param {Number} value
   */
  writeFloat(value) {
    this.expand(4)
    this.endian ? this.buffer.writeFloatBE(value, this.position) : this.buffer.writeFloatLE(value, this.position)
    this.position += 4
  }

  /**
   * Writes a signed int
   * @param {Number} value
   */
  writeInt(value) {
    this.expand(4)
    this.endian ? this.buffer.writeInt32BE(value, this.position) : this.buffer.writeInt32LE(value, this.position)
    this.position += 4
  }

  /**
   * Writes a multibyte string
   * @param {String} value
   * @param {String} charSet
   */
  writeMultiByte(value, charSet = 'utf8') {
    const length = Buffer.byteLength(value)

    if (encodingExists(charSet)) {
      this.buffer = Buffer.concat([this.buffer, encode(value, charSet)])
      this.position += length
    } else {
      throw new Error(`Invalid character set: ${charSet}`)
    }
  }

  /**
   * Writes a signed short
   * @param {Number} value
   */
  writeShort(value) {
    this.expand(2)
    this.endian ? this.buffer.writeInt16BE(value, this.position) : this.buffer.writeInt16LE(value, this.position)
    this.position += 2
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
    this.expand(4)
    this.endian ? this.buffer.writeUInt32BE(value, this.position) : this.buffer.writeUInt32LE(value, this.position)
    this.position += 4
  }

  /**
   * Writes an unsigned short
   * @param {Number} value
   */
  writeUnsignedShort(value) {
    this.expand(2)
    this.endian ? this.buffer.writeUInt16BE(value, this.position) : this.buffer.writeUInt16LE(value, this.position)
    this.position += 2
  }

  /**
   * Writes a UTF-8 string
   * @param {String} value
   */
  writeUTF(value) {
    const length = Buffer.byteLength(value)

    if (length > 65535) {
      throw new RangeError('The length can not be greater than 65535')
    }

    this.writeUnsignedShort(length)
    this.writeMultiByte(value)
  }

  /**
   * Writes multiple UTF-8 bytes
   * @param {String} value
   */
  writeUTFBytes(value) {
    this.writeMultiByte(value)
  }
}
