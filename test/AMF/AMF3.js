'use strict'

const it = require('tape')
const ByteArray = require('../../src/')
const IExternalizable = require('../../enums/IExternalizable')

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
  tape.plan(2)

  const ba = new ByteArray()

  const arr1 = ['A', 'A', 'C']
  const arr2 = [1, 2, 3, true, 1.2]

  const ref1 = [arr1, arr1]
  const ref2 = [ref1, arr2, arr2]

  const assocArr1 = Object.assign([], [1, 2, 3])
  const assocArr2 = Object.assign([], { 'A': 'B' })

  const refAssocArr = Object.assign([], { 'Test': [arr1, arr2, ref1, ref2] })
  const bigAssocArr = Object.assign([], { 'Test1': assocArr1, 'Test2': assocArr2, 'Test3': [assocArr1, assocArr2, refAssocArr] })

  ba.writeObject(refAssocArr)
  ba.writeObject(bigAssocArr)

  ba.position = 0

  tape.deepEqual(ba.readObject(), refAssocArr)
  tape.deepEqual(ba.readObject(), bigAssocArr)

  tape.end()
})

it('Can write/read AMF3 objects', (tape) => {
  const ba = new ByteArray()

  ba.writeObject({ name: 'Daan' })

  ba.position = 0

  tape.deepEqual(ba.readObject(), { name: 'Daan' })

  tape.end()
})

it('Can write/read AMF3 anonymous typed objects', (tape) => {
  class Person {
    constructor(name) {
      this.name = name
    }
  }

  const ba = new ByteArray()
  const person = new Person('Daan')

  ba.writeObject(person)

  ba.position = 0

  tape.deepEqual(ba.readObject(), { name: 'Daan' })

  tape.end()
})

it('Can write/read AMF3 typed objects', (tape) => {
  class Person {
    constructor(name) {
      this.name = name
    }
  }

  ByteArray.registerClassAlias('src.person', Person)

  const ba = new ByteArray()
  const person = new Person('Daan')

  ba.writeObject(person)

  ba.position = 0

  tape.deepEqual(ba.readObject(), { name: 'Daan' })

  tape.end()
})

it('Can write/read AMF3 IExternalizable objects', (tape) => {
  class Person extends IExternalizable {
    constructor(name) {
      super()

      this.name = name
    }

    writeExternal(ba) {
      ba.writeUTF(this.name)
    }

    readExternal(ba) {
      this.name = ba.readUTF()
    }
  }

  ByteArray.registerClassAlias('src.person', Person)

  const ba = new ByteArray()
  const person = new Person('Daan')

  ba.writeObject(person)

  ba.position = 0

  tape.deepEqual(ba.readObject(), { name: 'Daan' })

  tape.end()
})
