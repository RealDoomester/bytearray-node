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
 * @exports
 * @class
 */
module.exports = class ByteArray {
  /**
   * Used to preserve class objects
   * @type {Object}
   */
  static classMapping = {}
  /**
   * Used to preserve alias strings
   * @type {Object}
   */
  static aliasMapping = {}

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
     * @type {String}
     */
    this.endian = Endian.BIG_ENDIAN
    /**
     * The AMF object encoding
     * @type {Number}
     */
    this.objectEncoding = ObjectEncoding.AMF3
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
   * @returns {Object}
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
   * Preserves the class (type) of an object when the object is encoded in Action Message Format (AMF).
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

    this.classMapping[classObject] = aliasName
    this.aliasMapping[aliasName] = classObject
  }

  /**
   * Reads a buffer function
   * @param {String} func
   * @param {Number} pos
   * @returns {Number}
   */
  readBufferFunc(func, pos) {
    const value = this.buffer[func + this.endian](this.position)
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
    this.buffer[func + this.endian](value, this.position)
    this.position += pos
  }

  /**
   * Expands the buffer when needed
   * @param {Number} value
   */
  expand(value) {
    if (this.bytesAvailable < value) {
      this.buffer = Buffer.concat([this.buffer, Buffer.alloc(value - this.bytesAvailable)])
    }
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
   * Reads a multibyte string
   * @param {Number} length
   * @param {String} charset
   * @returns {String}
   */
  readMultiByte(length, charset = 'utf8') {
    const position = this.position
    this.position += length

    if (encodingExists(charset)) {
      return decode(this.buffer.slice(position, this.position), charset)
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
   * @returns {String}
   */
  toString() {
    return this.buffer.toString('utf8')
  }

  /**
   * Decompresses the buffer
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
    this.writeBufferFunc(value, 'writeInt32', 4)
  }

  /**
   * Writes a multibyte string
   * @param {String} value
   * @param {String} charset
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
      return new AMF0(this).write(value)
    } else if (this.objectEncoding === ObjectEncoding.AMF3) {
      return new AMF3(this).write(value)
    } else {
      throw new Error(`Unknown object encoding: '${this.objectEncoding}'.`)
    }
  }

  /**
   * Writes a signed short
   * @param {Number} value
   */
  writeShort(value) {
    this.writeBufferFunc(value, 'writeInt16', 2)
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
