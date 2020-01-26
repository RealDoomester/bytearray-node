'use strict'

/**
 * Our dependencies
 * @constant
 */
const it = require('tape')
const ByteArray = require('../../src/')
const ObjectEncoding = require('../../enums/ObjectEncoding')

/**
 * Our Flex enums
 * @constant
 */
const ArrayCollection = require('../../flex/ArrayCollection')
const ArrayList = require('../../flex/ArrayList')
const ObjectProxy = require('../../flex/ObjectProxy')
const ManagedObjectProxy = require('../../flex/ManagedObjectProxy')
const SerializationProxy = require('../../flex/SerializationProxy')
const AbstractMessage = require('../../flex/AbstractMessage')
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

it('Can write/read AMF3 ArrayList', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  const list = new ArrayList([1, 2, 3])

  ba.writeObject(list)

  ba.position = 0

  tape.deepEqual(ba.readObject(), list)

  tape.end()
})

it('Can write/read AMF3 ObjectProxy', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  const obj = new ObjectProxy({ name: 'Daan', age: 18 })

  ba.writeObject(obj)

  ba.position = 0

  tape.deepEqual(ba.readObject(), obj)

  tape.end()
})

it('Can write/read AMF3 ManagedObjectProxy', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  const obj = new ManagedObjectProxy({ name: 'Daan', age: 18 })

  ba.writeObject(obj)

  ba.position = 0

  tape.deepEqual(ba.readObject(), obj)

  tape.end()
})

it('Can write/read AMF0 SerializationProxy', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0
  const obj = new SerializationProxy({ id: 1 })

  ba.writeObject(obj)

  ba.position = 0

  tape.deepEqual(ba.readObject(), obj)

  tape.end()
})

it('Can write/read AMF3 AbstractMessage', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  const clientId = UUID.createUID()
  const messageId = UUID.createUID()
  const obj = new AbstractMessage({ test: true }, clientId, 'market-data-feed', { id: 1 }, messageId, Date.now())

  ba.writeObject(obj)

  ba.position = 0

  tape.deepEqual(ba.readObject(), obj)

  tape.end()
})
