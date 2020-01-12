'use strict'

/**
 * @exports
 * Generates a random string
 * @param {Number} length
 * @returns {String}
 */
exports.random_string = function random_string(length) {
  const set = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let str = ''

  for (let i = 0; i < length; i++) {
    const num = Math.floor(Math.random() * set.length)
    str += set.substring(num, num + 1)
  }

  return str
}

/**
 * @exports
 * Generates a random number between 2 numbers
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
exports.random_int = function random_int(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * @exports
 * Creates random objects
 * @param {Number} object_count
 * @param {Number} value_count
 * @returns {Array}
 */
exports.create_random_objects = function create_random_objects(object_count, value_count) {
  const objects = []

  for (let i = 0; i < object_count; i++) {
    const object = {}

    for (let i = 0; i < value_count; i++) {
      const p1 = exports.random_string(exports.random_int(1, 100))
      const p2 = Boolean(exports.random_int(0, 1))
      const p3 = exports.random_int(0, exports.random_int(0, 100))
      const p4 = exports.random_string(exports.random_int(1, 100))

      object[p1] = p2 ? p3 : p4
    }

    objects[i] = object
  }

  return objects
}
