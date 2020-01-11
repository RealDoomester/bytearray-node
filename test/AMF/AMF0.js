'use strict'

const it = require('tape')
const ByteArray = require('../../src/')
const ObjectEncoding = require('../../enums/ObjectEncoding')
const { randomBytes } = require('crypto')
const Unit = require('./unit')

it('Can write/read AMF0 values representing their marker', (tape) => {
  tape.plan(4)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  ba.writeObject(null)
  ba.writeObject(undefined)
  ba.writeObject(true)
  ba.writeObject(false)

  ba.position = 0

  tape.equal(ba.readObject(), null)
  tape.equal(ba.readObject(), undefined)
  tape.ok(ba.readObject())
  tape.notOk(ba.readObject())

  tape.end()
})

it('Can write/read AMF0 numbers', (tape) => {
  tape.plan(4)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  ba.writeObject(100)
  ba.writeObject(-5)
  ba.writeObject(563654)
  ba.writeObject(1.23)

  ba.position = 0

  tape.equal(ba.readObject(), 100)
  tape.equal(ba.readObject(), -5)
  tape.equal(ba.readObject(), 563654)
  tape.equal(ba.readObject(), 1.23)

  tape.end()
})

it('Can write/read AMF0 strings', (tape) => {
  tape.plan(2)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  const longString = randomBytes(32768).toString('hex')

  ba.writeObject('Action Message Format.')
  ba.writeObject(longString)

  ba.position = 0

  tape.equal(ba.readObject(), 'Action Message Format.')
  tape.equal(ba.readObject(), longString)

  tape.end()
})

it('Can write/read AMF0 objects', (tape) => {
  const samples = Unit.createObjects(5)
  tape.plan(samples.length)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  for (let i in samples) {
    ba.writeObject(samples[i])
  }

  ba.position = 0

  for (let i in samples) {
    tape.deepEqual(ba.readObject(), samples[i])
  }

  tape.end()
})

it('Can write/read AMF0 arrays', (tape) => {
  const samples = Unit.createArrays(5)
  tape.plan(samples.length)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  for (let i in samples) {
    ba.writeObject(samples[i])
  }

  ba.position = 0

  for (let i in samples) {
    tape.deepEqual(ba.readObject(), samples[i])
  }

  tape.end()
})

it('Can write/read AMF0 associative arrays', (tape) => {
  const samples = Unit.createAssocArrays(5)
  tape.plan(samples.length)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  for (let i in samples) {
    ba.writeObject(samples[i])
  }

  ba.position = 0

  for (let i in samples) {
    tape.deepEqual(ba.readObject(), samples[i])
  }

  tape.end()
})

it('Can write/read AMF0 dates', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  const date = new Date(2001, 11, 25)

  ba.writeObject(date)

  ba.position = 0

  tape.deepEqual(ba.readObject(), date)

  tape.end()
})

it('Can write/read AMF0 typed objects', (tape) => {
  tape.plan(6)

  class Person {
    constructor(name, age, obj) {
      this.name = name
      this.age = age
      this.obj = obj
    }
  }

  const refObj = { id: 1 }

  ByteArray.registerClassAlias('com.person', Person)

  tape.equal(ByteArray.classMapping[Person], 'com.person')
  tape.equal(ByteArray.aliasMapping['com.person'], Person)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  const obj1 = new Person('Daan', 17, refObj)
  const obj2 = new Person('Gravix', 15, refObj)

  ba.writeObject(obj1)
  ba.writeObject(obj2)

  ba.position = 0

  const readObj1 = ba.readObject()
  const readObj2 = ba.readObject()

  tape.deepEqual(readObj1, obj1)
  tape.equal(readObj1.constructor.name, 'Person')
  tape.deepEqual(readObj2, obj2)
  tape.equal(readObj2.constructor.name, 'Person')

  tape.end()
})

it('Can write/read AMF0 anonymous typed objects', (tape) => {
  tape.plan(2)

  class Person {
    constructor(name) {
      this.name = name
    }
  }

  const ba = new ByteArray()
  const person = new Person('Daan')

  ba.objectEncoding = ObjectEncoding.AMF0
  ba.writeObject(person)
  ba.position = 0

  const obj = ba.readObject()

  tape.equal(obj.constructor, Object)
  tape.deepEqual(obj, person)

  tape.end()
})
