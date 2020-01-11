'use strict'

const it = require('tape')
const ByteArray = require('../../src/')
const Unit = require('./unit')

it('Can write/read AMF3 values representing their marker', (tape) => {
  tape.plan(4)

  const ba = new ByteArray()

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

it('Can write/read AMF3 numbers', (tape) => {
  tape.plan(6)

  const ba = new ByteArray()

  ba.writeObject(100)
  ba.writeObject(-5)
  ba.writeObject(563654)
  ba.writeObject(1.23)
  ba.writeObject(268435455)
  ba.writeObject(-268435456)

  ba.position = 0

  tape.equal(ba.readObject(), 100)
  tape.equal(ba.readObject(), -5)
  tape.equal(ba.readObject(), 563654)
  tape.equal(ba.readObject(), 1.23)
  tape.equal(ba.readObject(), 268435455)
  tape.equal(ba.readObject(), -268435456)

  tape.end()
})

it('Can write/read AMF3 strings', (tape) => {
  tape.plan(2)

  const ba = new ByteArray()

  ba.writeObject('Action Message Format.')
  ba.writeObject('This is a test.')

  ba.position = 0

  tape.equal(ba.readObject(), 'Action Message Format.')
  tape.equal(ba.readObject(), 'This is a test.')

  tape.end()
})

it('Can write/read AMF3 dates', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  const date = new Date(2001, 11, 25)

  ba.writeObject(date)

  ba.position = 0

  tape.deepEqual(ba.readObject(), date)

  tape.end()
})

it('Can write/read AMF3 arrays', (tape) => {
  const samples = Unit.createArrays(5)
  tape.plan(samples.length)

  const ba = new ByteArray()

  for (let i in samples) {
    ba.writeObject(samples[i])
  }

  ba.position = 0

  for (let i in samples) {
    tape.deepEqual(ba.readObject(), samples[i])
  }

  tape.end()
})

it('Can write/read AMF3 associative arrays', (tape) => {
  const samples = Unit.createAssocArrays(5)
  tape.plan(samples.length)

  const ba = new ByteArray()

  for (let i in samples) {
    ba.writeObject(samples[i])
  }

  ba.position = 0

  for (let i in samples) {
    tape.deepEqual(ba.readObject(), samples[i])
  }

  tape.end()
})
