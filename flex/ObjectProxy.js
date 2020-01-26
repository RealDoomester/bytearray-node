'use strict'

/**
 * @exports
 * @class
 * @extends IExternalizable
 */
module.exports = class ObjectProxy extends require('../enums/IExternalizable') {
  /**
   * @constructor
   * @param {Object} obj
   */
  constructor(obj) {
    super()
    /**
     * Set constructor properties when needed
     */
    if (typeof obj === 'object' && Object.keys(obj).length > 0) {
      for (const key in obj) {
        this[key] = obj[key]
      }
    }
  }

  /**
   * Write the ObjectProxy
   * @param {ByteArray} ba
   */
  writeExternal(ba) {
    const obj = {}

    for (const key in this) {
      obj[key] = this[key]
    }

    ba.writeObject(obj)
  }

  /**
   * Read the ObjectProxy
   * @param {ByteArray} ba
   */
  readExternal(ba) {
    const obj = ba.readObject()

    for (const key in obj) {
      this[key] = obj[key]
    }
  }
}
