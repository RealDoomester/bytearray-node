'use strict'

/**
 * @exports
 * @class
 */
module.exports = class Packet {
  /**
   * @constructor
   * @param {Array} headers
   * @param {Array} messages
   * @param {Number} version
   */
  constructor(headers = [], messages = [], version = 3) {
    /**
     * The packet headers
     * @type {Array}
     */
    this.headers = headers
    /**
     * The packet messages
     * @type {Array}
     */
    this.messages = messages
    /**
     * The packet version
     * @type {Number}
     */
    this.version = version
  }
}
