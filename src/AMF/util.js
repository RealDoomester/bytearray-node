'use strict'

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
  return { Int32Array: 'VECTOR_INT', Uint32Array: 'VECTOR_UINT', Float64Array: 'VECTOR_DOUBLE' }[type.name]
}

/**
 * @exports
 * Returns the write function of the given typed array
 * @param {Object} type
 * @returns {String}
 */
exports.getTypedWriteFunc = (type) => {
  return { Int32Array: 'writeInt', Uint32Array: 'writeUnsignedInt', Float64Array: 'writeDouble' }[type.name]
}

/**
 * @exports
 * Returns the read function of the given typed array
 * @param {Object} type
 * @returns {String}
 */
exports.getTypedReadFunc = (type) => {
  return { Int32Array: 'readInt', Uint32Array: 'readUnsignedInt', Float64Array: 'readDouble' }[type.name]
}

/**
 * @exports
 * Returns the constructed variant of the given typed array
 * @param {String} type
 * @param {Number} length
 * @returns {Object}
 */
exports.getTypedConstruct = (type, length) => {
  if (type === 'int') {
    return new Int32Array(length)
  } else if (type === 'uint') {
    return new Uint32Array(length)
  } else {
    return new Float64Array(length)
  }
}
