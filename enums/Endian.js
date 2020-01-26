'use strict'

/**
 * @exports
 */
module.exports = Object.freeze({ LITTLE_ENDIAN: 'LE', BIG_ENDIAN: 'BE', SYSTEM: require('os').endianness() })
