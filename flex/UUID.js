'use strict'

/**
 * Our dependencies
 * @constant
 */
const ByteArray = require('../src')
const uuidv4 = require('uuid/v4')

/**
 * @exports
 * Returns a 128-bit random UID
 * @returns {String}
 */
exports.createUID = () => uuidv4().toString().toUpperCase()

/**
 * @exports
 * Returns whether the given UID is valid or not
 * @param {String} uid
 * @returns {Boolean}
 */
exports.isUID = (uid) => uid.match(new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)) !== null

/**
 * @exports
 * Converts a 128-bit UID encoded ByteArray to a string
 * @param {ByteArray} ba
 * @returns {String}
 */
exports.fromByteArray = (ba) => {
  let res = ''

  if (!ba || ba.length !== 16) {
    throw new Error('The given ByteArray (if given) does not have enough bytes to read a valid UID.')
  }

  for (let i = 0; i < 16; i++) {
    res += i % 2 === 0 && i >= 4 && i <= 10 ? '-' : ''
    res += ((ba.buffer[i] & 0xF0) >>> 4).toString(16)
    res += (ba.buffer[i] & 0x0F).toString(16)
  }

  return res.toUpperCase()
}

/**
 * @exports
 * Converts a 128-bit UID to an encoded ByteArray
 * @param {String} uid
 * @returns {ByteArray}
 */
exports.toByteArray = (uid) => {
  if (!exports.isUID(uid)) {
    throw new Error('The given UID is invalid.')
  }

  const ba = new ByteArray(36)

  for (let i = 0; i < 36; i++) {
    if (uid.charAt(i) !== '-') {
      ba.writeUnsignedByte(((parseInt(uid.charAt(i++), 16) << 4) | parseInt(uid.charAt(i), 16)) & 0xFF)
    }
  }

  ba.position = 0

  return ba
}
