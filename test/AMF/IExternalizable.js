'use strict'

const it = require('tape')
const ByteArray = require('../../src/')
const IExternalizable = require('../../enums/IExternalizable')

class Test extends IExternalizable {
  constructor(name, age) {
    super()

    this.name = name
    this.age = age
  }

  writeExternal(ba) {
    ba.writeUTF(this.name)
    ba.writeUnsignedByte(this.age)
  }

  readExternal(ba) {
    this.name = ba.readUTF()
    this.age = ba.readUnsignedByte()
  }
}

it('Supports IExternalizable', (tape) => {
  const ba = new ByteArray()
  const test = new Test('Daan', 18)

  test.writeExternal(ba)

  ba.position = 0
  test.name = undefined
  test.age = undefined

  test.readExternal(ba)

  tape.equal(test.name, 'Daan')
  tape.equal(test.age, 18)

  tape.end()
})
