'use strict'

/**
 * @exports
 * @class
 * @extends ObjectProxy
 */
module.exports = class ManagedObjectProxy extends require('./ObjectProxy') {
  /**
   * @constructor
   * @param {Object} obj
   */
  constructor(obj) {
    super(obj)
  }

  /**
   * Write the ObjectProxy
   * @param {ByteArray} ba
   */
  writeExternal(ba) {
    super.writeExternal(ba)
  }

  /**
   * Read the ObjectProxy
   * @param {ByteArray} ba
   */
  readExternal(ba) {
    super.readExternal(ba)
  }
}
