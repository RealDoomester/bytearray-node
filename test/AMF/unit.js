'use strict'

/**
 * @exports
 * Generates a random string
 * @param {Number} len
 * @returns {String}
 */
exports.randomStr = function randomStr(len) {
  const set = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let str = ''

  for (let i = 0; i < len; i++) {
    const num = Math.floor(Math.random() * set.length)
    str += set.substring(num, num + 1)
  }

  return str
}

/**
 * @exports
 * Generates a random integer
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
exports.randomInt = function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * @exports
 * Creates random associative arrays
 * @param {Number} cnt
 * @returns {Array}
 */
exports.createAssocArrays = function createAssocArrays(cnt) {
  const arrays = []

  for (let i = 0; i < cnt; i++) {
    const assocArr = {}
    const amount = exports.randomInt(0, 25)

    for (let i = 0; i < amount; i++) {
      assocArr[exports.randomStr(1, 100)] = Boolean(exports.randomInt(0, 1)) ? exports.randomInt(0, 100) : exports.randomStr(1, 100)
    }

    arrays[i] = Object.assign([], assocArr)
  }

  return arrays
}

/**
 * @exports
 * Creates random arrays
 * @param {Number} cnt
 * @returns {Array}
 */
exports.createArrays = function createArrays(cnt) {
  const arrays = []

  for (let i = 0; i < cnt; i++) {
    const arr = []
    const amount = exports.randomInt(0, 25)

    for (let i = 0; i < amount; i++) {
      arr[i] = Boolean(exports.randomInt(0, 1)) ? exports.randomInt(0, 100) : exports.randomStr(1, 100)
    }

    arrays[i] = arr
  }

  return arrays
}

/**
 * @exports
 * Creates random objects
 * @param {Number} cnt
 * @returns {Array}
 */
exports.createObjects = function createObjects(cnt) {
  const objects = []

  for (let i = 0; i < cnt; i++) {
    const obj = {}
    const amount = exports.randomInt(0, 25)

    for (let i = 0; i < amount; i++) {
      obj[exports.randomStr(1, 100)] = Boolean(exports.randomInt(0, 1)) ? exports.randomInt(0, 100) : exports.randomStr(1, 100)
    }

    objects[i] = obj
  }

  return objects
}
