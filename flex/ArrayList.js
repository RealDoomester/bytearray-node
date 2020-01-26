'use strict'

/**
 * @exports
 * @class
 * @extends ArrayCollection
 */
module.exports = class ArrayList extends require('./ArrayCollection') {
  /**
   * @constructor
   * @param {Array} source
   */
  constructor(source = []) {
    super(source)
  }

  /**
   * Write the ArrayList
   * @param {ByteArray} ba
   */
  writeExternal(ba) {
    super.writeExternal(ba)
  }

  /**
   * Read the ArrayList
   * @param {ByteArray} ba
   */
  readExternal(ba) {
    super.readExternal(ba)
  }
}
