'use strict'

const it = require('tape')
const ByteArray = require('../../src/')

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
  tape.plan(8)

  const ba = new ByteArray()

  ba.writeObject(100)
  ba.writeObject(-5)
  ba.writeObject(563654)
  ba.writeObject(1.23)
  ba.writeObject(268435455)
  ba.writeObject(-268435456)
  ba.writeObject(268435456)

  ba.position = 0

  tape.equal(ba.readObject(), 100)
  tape.equal(ba.readObject(), -5)
  tape.equal(ba.readObject(), 563654)
  tape.equal(ba.readObject(), 1.23)
  tape.equal(ba.readObject(), 268435455)
  tape.equal(ba.readObject(), -268435456)
  tape.equal(ba.readByte(), 5)
  ba.position--
  tape.equal(ba.readObject(), 268435456)

  tape.end()
})
