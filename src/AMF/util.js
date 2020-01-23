'use strict'

const { createHash } = require('crypto')

/**
 * @exports
 * Returns a hashed object
 * @param {Object} obj
 * @returns {String}
 */
exports.hash = (obj) => createHash('md5').update(JSON.stringify(obj)).digest('hex')

/**
 * @exports
 * Returns whether the given array is dense or not
 * @param {Array} arr
 * @returns {Boolean}
 */
exports.isDenseArray = (arr) => Object.keys(arr).length === arr.length

/**
 * @exports
 * Returns whether the given integer fits in a variable-length unsigned 29-bit integer
 * @param {Number} int
 * @returns {Boolean}
 */
exports.isUInt29 = (int) => int << 3 >> 3 === int

/**
 * @exports
 * Returns whether the given type is vector like or not
 * @param {Object} type
 * @returns {Boolean}
 */
exports.isVectorLike = (type) => [Int32Array, Uint32Array, Float64Array].indexOf(type) !== -1

/**
 * @exports
 * Returns the marker key of the given typed array
 * @param {Object} type
 * @returns {String}
 */
exports.getTypedMarkerKey = (type) => {
  let key = ''

  switch (type) {
    case Int32Array: key = 'VECTOR_INT'; break
    case Uint32Array: key = 'VECTOR_UINT'; break
    case Float64Array: key = 'VECTOR_DOUBLE'; break
  }

  return key
}

/**
 * @exports
 * Returns the write function of the given typed array
 * @param {Object} type
 * @returns {String}
 */
exports.getTypedWriteFunc = (type) => {
  let func = ''

  switch (type) {
    case Int32Array: func = 'writeInt'; break
    case Uint32Array: func = 'writeUnsignedInt'; break
    case Float64Array: func = 'writeDouble'; break
  }

  return func
}

/**
 * @exports
 * Returns the read function of the given typed array
 * @param {Object} type
 * @returns {String}
 */
exports.getTypedReadFunc = (type) => {
  let func = ''

  switch (type) {
    case Int32Array: func = 'readInt'; break
    case Uint32Array: func = 'readUnsignedInt'; break
    case Float64Array: func = 'readDouble'; break
  }

  return func
}

/**
 * @exports
 * Returns the constructed variant of the given typed array
 * @param {String} type
 * @param {Number} length
 * @returns {Object}
 */
exports.getTypedConstruct = (type, length) => {
  let constructed

  switch (type) {
    case 'int': constructed = new Int32Array(length); break
    case 'uint': constructed = new Uint32Array(length); break
    case 'double': constructed = new Float64Array(length); break
  }

  return constructed
}
