'use strict'

/**
 * Our enums
 * @constant
 */
const ObjectEncoding = require('../enums/ObjectEncoding')

/**
 * @exports
 * @class
 * @extends IExternalizable
 */
module.exports = class SerializationProxy extends require('../enums/IExternalizable') {
  /**
   * @constructor
   * @param {Object} defaultInstance
   */
  constructor(defaultInstance = {}) {
    super()
    /**
     * The default instance
     * @type {Object}
     */
    this.defaultInstance = defaultInstance
  }

  /**
   * Write the SerializationProxy
   * @param {ByteArray} ba
   */
  writeExternal(ba) {
    if (ba.objectEncoding === ObjectEncoding.AMF3) {
      throw new Error('This method should not be used for AMF3 serialization.')
    }

    ba.writeObject(this.defaultInstance)
  }

  /**
   * Read the SerializationProxy
   * @param {ByteArray} ba
   */
  readExternal(ba) {
    try {
      this.defaultInstance = ba.readObject()
    } catch (err) {
      throw err
    }
  }
}
