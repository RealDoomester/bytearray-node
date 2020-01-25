'use strict'

/**
 * Our enums
 * @constant
 */
const IExternalizable = require('../enums/IExternalizable')

/**
 * @exports
 * @class
 * @extends IExternalizable
 */
module.exports = class ArrayCollection extends IExternalizable {
  /**
   * @constructor
   * @param {Array} source
   */
  constructor(source = []) {
    super()
    /**
     * The source
     * @type {Array}
     */
    this.source = source
  }

  /**
   * Write the ArrayCollection
   * @param {ByteArray} ba
   */
  writeExternal(ba) {
    ba.writeObject(this.source)
  }

  /**
   * Read the ArrayCollection
   * @param {ByteArray} ba
   */
  readExternal(ba) {
    this.source = ba.readObject()
  }
}
