'use strict'

/**
 * Our dependencies
 * @constant
 */
const it = require('tape')
const ByteArray = require('../../src/')

/**
 * Our enums
 * @constant
 */
const Packet = require('../../enums/Packet')

it('Can read an AMF0 packet', (tape) => {
  tape.plan(4)

  const buffer = Buffer.from('00 00 00 01 00 08 4d 79 48 65 61 64 65 72 00 00 00 00 11 03 00 02 69 64 00 3f f0 00 00 00 00 00 00 00 00 09 00 01 00 05 50 69 7a 7a 61 00 01 2f 00 00 00 0a 0a 00 00 00 01 02 00 02 68 69'.replace(/ /g, ''), 'hex')
  const ba = new ByteArray(buffer)
  const packet = ba.readMessage()

  const headers = [{ name: 'MyHeader', mustUnderstand: false, length: 17, value: { id: 1 } }]
  const messages = [{ targetURI: 'Pizza', responseURI: '/', length: 10, value: ['hi'] }]

  tape.equal(packet.version, 0)
  tape.deepEqual(packet.headers, headers)
  tape.deepEqual(packet.messages, messages)
  tape.deepEqual(packet.constructor, Packet)

  tape.end()
})

it('Can read an AMF3 packet', (tape) => {
  tape.plan(4)

  const buffer = Buffer.from('00 03 00 01 00 08 4d 79 48 65 61 64 65 72 00 00 00 00 0a 11 0a 0b 01 05 69 64 04 01 01 00 01 00 05 50 69 7a 7a 61 00 01 2f 00 00 00 0a 0a 00 00 00 01 02 00 02 68 69'.replace(/ /g, ''), 'hex')
  const ba = new ByteArray(buffer)
  const packet = ba.readMessage()

  const headers = [{ name: 'MyHeader', mustUnderstand: false, length: 10, value: { id: 1 } }]
  const messages = [{ targetURI: 'Pizza', responseURI: '/', length: 10, value: ['hi'] }]

  tape.equal(packet.version, 3)
  tape.deepEqual(packet.headers, headers)
  tape.deepEqual(packet.messages, messages)
  tape.deepEqual(packet.constructor, Packet)

  tape.end()
})
