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
const UUID = require('../../flex/UUID')

it('Can convert a 128-bit UID from ByteArray to string, and reversed', (tape) => {
  tape.plan(1)

  const uid = UUID.createUID()

  tape.deepEqual(UUID.fromByteArray(UUID.toByteArray(uid)), uid)

  tape.end()
})

it('Can write/read AMF3 ArrayCollection', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  const collection = new ArrayCollection([1, 2, 3])

  ba.writeObject(collection)

  ba.position = 0

  tape.deepEqual(ba.readObject(), collection)

  tape.end()
})
