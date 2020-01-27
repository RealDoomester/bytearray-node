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
    let nextFlags = 0

    const clientIdBytes = typeof this.clientId === 'string' && this.clientId.length > 0 ? toByteArray(this.clientId) : null
    const messageIdBytes = typeof this.messageId === 'string' && this.messageId.length > 0 ? toByteArray(this.messageId) : null

    const hasClientId = clientIdBytes !== null
    const hasMessageId = messageIdBytes !== null
    const hasBody = typeof this.body === 'object' && Object.keys(this.body).length > 0
    const hasDestination = typeof this.destination === 'string' && this.destination !== ''
    const hasHeaders = typeof this.headers === 'object' && Object.keys(this.headers).length > 0
    const hasTimestamp = typeof this.timestamp === 'number' && this.timestamp !== 0
    const hasTimeToLive = typeof this.timeToLive === 'number' && this.timeToLive !== 0

    const flagRules = [
      [hasBody, 1],
      [hasClientId, 2],
      [hasDestination, 4],
      [hasHeaders, 8],
      [hasMessageId, 16],
      [hasTimestamp, 32],
      [hasTimeToLive, 64],
      [hasClientId || hasMessageId, 128],
      [hasClientId, 1],
      [hasMessageId, 2]
    ]

    for (let i = 0, flags = 0; i < flagRules.length; i++) {
      const [hasFlag, bit] = flagRules[i]

      if (i >= 0 && i <= 7) {
        flags |= hasFlag ? bit : flags

        if (i + 1 === flagRules.length - 2) {
          ba.writeUnsignedByte(flags)
        }
      } else {
        nextFlags |= hasFlag ? bit : nextFlags
      }
    }

    const writeRules = [
      [nextFlags !== 0, nextFlags],
      [hasBody, this.body],
      [hasClientId, this.clientId],
      [hasDestination, this.destination],
      [hasHeaders, this.headers],
      [hasMessageId, this.messageId],
      [hasTimestamp, this.timestamp],
      [hasTimeToLive, this.timeToLive],
      [hasClientId, clientIdBytes],
      [hasMessageId, messageIdBytes]
    ]

    for (let i = 0; i < writeRules.length; i++) {
      const [canWrite, value] = writeRules[i]

      if (canWrite) {
        i === 0 ? ba.writeUnsignedByte(value) : ba.writeObject(value)
      }
    }
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
