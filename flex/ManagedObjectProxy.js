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
   * Write the ManagedObjectProxy
   * @param {ByteArray} ba
   */
  writeExternal(ba) {
    super.writeExternal(ba)
  }

  /**
   * Read the ManagedObjectProxy
   * @param {ByteArray} ba
   */
  readExternal(ba) {
    super.readExternal(ba)
  }
}
