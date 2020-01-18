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
 * Returns whether the given integer is uint29 or not
 * @param {Number} int
 * @returns {Boolean}
 */
exports.isUInt29 = (int) => int << 3 >> 3 === int

/**
 * @exports
 * Returns the type of the given Vector
 * @param {Object} vec
 * @returns {String}
 */
exports.getVectorType = (vec) => {
  return Object.prototype.toString.call(vec).split(' ')[1].slice(0, -1)
}

/**
 * @exports
 * Returns the marker key of the given Vector
 * @param {Object} vec
 * @returns {String}
 */
exports.getVectorMarkerKey = (vec) => {
  return exports.getVectorType(vec).toUpperCase().replace('.', '_')
}

/**
 * @exports
 * Returns the write key of the given Vector
 * @param {Object} vec
 * @returns {String}
 */
exports.getVectorWriteKey = (vec) => {
  return {
    'Vector.int': 'byteArr.writeInt',
    'Vector.uint': 'byteArr.writeUnsignedInt',
    'Vector.double': 'byteArr.writeDouble',
    'Vector.object': 'write'
  }[exports.getVectorType(vec)]
}

/**
 * @exports
 * Returns the read key of the given Vector
 * @param {Object} vec
 * @returns {String}
 */
exports.getVectorReadKey = (vec) => {
  return {
    'Vector.int': 'byteArr.readInt',
    'Vector.uint': 'byteArr.readUnsignedInt',
    'Vector.double': 'byteArr.readDouble',
    'Vector.object': 'read'
  }[exports.getVectorType(vec)]
}

/**
 * @exports
 * Returns whether the given object is a Vector or not
 * @param {Object} obj
 * @returns {Boolean}
 */
exports.isVector = (obj) => {
  return [
    'Vector.int', 'Vector.uint', 'Vector.double', 'Vector.object'
  ].indexOf(exports.getVectorType(obj)) !== -1
}