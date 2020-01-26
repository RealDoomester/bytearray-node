'use strict'

/**
 * Our overridden IExternalizable interface
 * @constant
 */
const IExternalizable = require('interface').create('writeExternal', 'readExternal', 'readFlags', 'readOtherFlags')

/**
 * Our dependencies
 * @constant
 */
const { toByteArray, fromByteArray } = require('../flex/UUID')

/**
 * @exports
 * @class
 * @extends IExternalizable
 */
module.exports = class AbstractMessage extends IExternalizable {
  /**
   * @constructor
   * @param {Object} body
   * @param {String} clientId
   * @param {String} destination
   * @param {Object} headers
   * @param {String} messageId
   * @param {Number} timestamp
   * @param {Number} timeToLive
   */
  constructor(body = {}, clientId = '', destination = '', headers = {}, messageId = '', timestamp = 0, timeToLive = 0) {
    super()
    /**
     * The body of a message contains the specific data that needs to be delivered to the remote destination
     * @type {Object}
     */
    this.body = body
    /**
     * The clientId indicates which MessageAgent sent the message.
     * @type {String}
     */
    this.clientId = clientId
    /**
     * The message destination
     * @type {String}
     */
    this.destination = destination
    /**
     * The headers of a message are an associative array where the key is the header name and the value is the header value
     * @type {Object}
     */
    this.headers = headers
    /**
     * The unique id for the message
     * @type {String}
     */
    this.messageId = messageId
    /**
     * Provides access to the time stamp for the message
     * @type {Number}
     */
    this.timestamp = timestamp
    /**
     * The time to live value of a message indicates how long the message should be considered valid and deliverable
     * @type {Number}
     */
    this.timeToLive = timeToLive
  }

  /**
   * Write the AbstractMessage
   * @param {ByteArray} ba
   */
  writeExternal(ba) {
    const hasBody = Object.keys(this.body).length > 0
    const hasDestination = this.destination !== ''
    const hasHeaders = Object.keys(this.headers).length > 0
    const hasTimestamp = this.timestamp !== 0
    const hasTimeToLive = this.timeToLive !== 0

    let flags = 0
    let nextFlags = 0
    const clientIdBytes = typeof this.clientId === 'string' && this.clientId.length > 0 ? toByteArray(this.clientId) : null
    const messageIdBytes = typeof this.messageId === 'string' && this.messageId.length > 0 ? toByteArray(this.messageId) : null

    flags |= hasBody ? 1 : flags
    flags |= clientIdBytes ? 2 : flags
    flags |= hasDestination ? 4 : flags
    flags |= hasHeaders ? 8 : flags
    flags |= messageIdBytes ? 16 : flags
    flags |= hasTimestamp ? 32 : flags
    flags |= hasTimeToLive ? 64 : flags
    flags |= clientIdBytes || messageIdBytes ? 128 : flags

    ba.writeUnsignedByte(flags)

    nextFlags |= clientIdBytes ? 1 : nextFlags
    nextFlags |= messageIdBytes ? 2 : nextFlags

    if (nextFlags !== 0) ba.writeUnsignedByte(nextFlags)
    if (hasBody) ba.writeObject(this.body)
    if (clientIdBytes) ba.writeObject(this.clientId)
    if (hasDestination) ba.writeObject(this.destination)
    if (hasHeaders) ba.writeObject(this.headers)
    if (messageIdBytes) ba.writeObject(this.messageId)
    if (hasTimestamp) ba.writeObject(this.timestamp)
    if (hasTimeToLive) ba.writeObject(this.timeToLive)
    if (clientIdBytes) ba.writeObject(clientIdBytes)
    if (messageIdBytes) ba.writeObject(messageIdBytes)
  }

  /**
   * Read the AbstractMessage
   * @param {ByteArray} ba
   */
  readExternal(ba) {
    const flagsArray = this.readFlags(ba)

    for (let i = 0; i < flagsArray.length; i++) {
      const flags = flagsArray[i]
      const reservedPosition = i === 0 ? 7 : i === 1 ? 2 : 0

      if (i === 0) {
        this.body = flags & 1 ? ba.readObject() : this.body
        this.clientId = flags & 2 ? ba.readObject() : this.clientId
        this.destination = flags & 4 ? ba.readObject() : this.destination
        this.headers = flags & 8 ? ba.readObject() : this.headers
        this.messageId = flags & 16 ? ba.readObject() : this.messageId
        this.timestamp = flags & 32 ? ba.readObject() : this.timestamp
        this.timeToLive = flags & 64 ? ba.readObject() : this.timeToLive
      } else if (i === 1) {
        this.clientId = flags & 1 ? fromByteArray(ba.readObject()) : this.clientId
        this.messageId = flags & 2 ? fromByteArray(ba.readObject()) : this.messageId
      }

      this.readOtherFlags(flags, reservedPosition, ba)
    }
  }

  /**
   * Read the flags
   * @param {ByteArray} ba
   * @returns {Array}
   */
  readFlags(ba) {
    let hasNextFlag = 1
    const flagsArray = []

    for (let i = 0; hasNextFlag; i++) {
      flagsArray[i] = ba.readUnsignedByte()
      hasNextFlag = flagsArray[i] & 128
    }

    return flagsArray
  }

  /**
   * Read in any other flagged objects to preserve integrity
   * @param {Number} flags
   * @param {Number} reservedPosition
   * @param {ByteArray} ba
   */
  readOtherFlags(flags, reservedPosition, ba) {
    if (flags >> reservedPosition) {
      for (let i = reservedPosition; i < 6; i++) {
        if ((flags >> i) & 1) {
          ba.readObject()
        }
      }
    }
  }
}
