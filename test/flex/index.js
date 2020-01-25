'use strict'

/**
 * Our dependencies
 * @constant
 */
const it = require('tape')
const ByteArray = require('../../src/')

/**
 * Our Flex enums
 * @constant
 */
const ArrayCollection = require('../../flex/ArrayCollection')

it('Can write/read AMF3 ArrayCollection', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  const collection = new ArrayCollection([1, 2, 3])

  ba.writeObject(collection)

  ba.position = 0

  tape.deepEqual(ba.readObject(), collection)

  tape.end()
})
