'use strict'

const it = require('tape')
const ByteArray = require('../src/')
const Endian = require('../enums/Endian')

it('Can write/read a byte', (tape) => {
  const ba = new ByteArray()

  ba.writeByte(1)
  ba.writeUnsignedByte(2)

  ba.position = 0

  tape.equal(ba.readByte(), 1)
  tape.equal(ba.readUnsignedByte(), 2)

  tape.end()
})

it('Can write/read a boolean', (tape) => {
  const ba = new ByteArray()

  ba.writeBoolean(true)
  ba.writeBoolean(false)

  ba.position = 0

  tape.ok(ba.readBoolean())
  tape.notOk(ba.readBoolean())

  tape.end()
})

it('Can write/read bytes', (tape) => {
  const ba = new ByteArray()

  ba.writeByte(1)
  ba.writeByte(2)
  ba.writeByte(3)

  const rb = new ByteArray()

  rb.writeBytes(ba)
  rb.position = 0

  tape.equal(rb.readByte(), 1)
  tape.equal(rb.readByte(), 2)
  tape.equal(rb.readByte(), 3)

  rb.clear()

  rb.writeBytes(ba)
  rb.writeByte(4)
  rb.writeByte(5)
  rb.writeByte(6)

  rb.position = 3
  rb.readBytes(ba, 3, 3)

  tape.equal(ba.readByte(), 4)
  tape.equal(ba.readByte(), 5)
  tape.equal(ba.readByte(), 6)

  tape.end()
})

it('Can write/read a short', (tape) => {
  const ba = new ByteArray()

  ba.writeShort(1)
  ba.writeUnsignedShort(2)

  ba.position = 0

  tape.equal(ba.readShort(), 1)
  tape.equal(ba.readUnsignedShort(), 2)

  tape.end()
})

it('Can write/read an int', (tape) => {
  const ba = new ByteArray()

  ba.writeInt(1)
  ba.writeUnsignedInt(2)

  ba.position = 0

  tape.equal(ba.readInt(), 1)
  tape.equal(ba.readUnsignedInt(), 2)

  tape.end()
})

it('Can write/read a float/double', (tape) => {
  const ba = new ByteArray()

  ba.writeFloat(1.23)
  ba.writeDouble(2.456)

  ba.position = 0

  tape.equal(parseFloat(ba.readFloat().toFixed(2)), 1.23)
  tape.equal(ba.readDouble(), 2.456)

  tape.end()
})

it('Can write/read a string', (tape) => {
  const ba = new ByteArray()

  ba.writeUTF('Hello World!')
  ba.writeUTFBytes('Hello')
  ba.writeMultiByte('Foo', 'ascii')

  ba.position = 0

  tape.equal(ba.readUTF(), 'Hello World!')
  tape.equal(ba.readUTFBytes(5), 'Hello')
  tape.equal(ba.readMultiByte(3, 'ascii'), 'Foo')

  ba.clear()
  ba.writeMultiByte('Hello', 'win1251')

  ba.position = 0

  tape.equal(ba.readMultiByte(5, 'win1251'), 'Hello')

  tape.end()
})

it('Can compress/uncompress the buffer', (tape) => {
  const ba = new ByteArray()

  ba.writeUTF('Hello World!')

  ba.compress('deflate')
  ba.uncompress('deflate')

  tape.equal(ba.readUTF(), 'Hello World!')

  ba.clear()

  ba.writeUTF('Hello World!')

  ba.compress('zlib')
  ba.uncompress('zlib')

  tape.equal(ba.readUTF(), 'Hello World!')

  tape.end()
})

it('Supports BE/LE', (tape) => {
  const ba = new ByteArray()

  ba.endian = Endian.LITTLE_ENDIAN
  ba.writeShort(1)

  ba.endian = Endian.BIG_ENDIAN
  ba.writeShort(2)

  ba.position = 0

  ba.endian = Endian.LITTLE_ENDIAN
  tape.equal(ba.readShort(), 1)

  ba.endian = Endian.BIG_ENDIAN
  tape.equal(ba.readShort(), 2)

  tape.end()
})

it('Supports starting buffers in the constructor', (tape) => {
  const ba = new ByteArray([1, 2, 3])

  tape.equal(ba.readByte(), 1)
  tape.equal(ba.readByte(), 2)
  tape.equal(ba.readByte(), 3)

  const buffer = Buffer.alloc(3)

  buffer.writeInt8(1, 0)
  buffer.writeInt8(2, 1)
  buffer.writeInt8(3, 2)

  const ba2 = new ByteArray(buffer)

  tape.equal(ba2.readByte(), 1)
  tape.equal(ba2.readByte(), 2)
  tape.equal(ba2.readByte(), 3)

  tape.end()
})

it('Supports a while loop using bytesAvailable', (tape) => {
  const ba = new ByteArray([69, 70, 69, 79, 69, 79])
  let str = ''

  while (ba.bytesAvailable > 0) {
    if (ba.readByte() === 69) {
      str += ba.readUTFBytes(1)
    }
  }

  tape.equal(str, 'FOO')

  tape.end()
})

it('Supports the length property', (tape) => {
  const ba = new ByteArray()

  ba.length = 3
  tape.equal(ba.length, 3)

  ba.writeByte(1)
  tape.equal(ba.buffer[0], 1)
  tape.equal(ba.position, 1)
  tape.equal(ba.length, 3)
  tape.equal(ba.bytesAvailable, 2)

  ba.clear()
  tape.equal(ba.length, 0)

  ba.length = 1
  ba.writeUTF('Hello')
  tape.equal(ba.length, 7)

  ba.position = 0
  tape.equal(ba.readUTF(), 'Hello')
  tape.equal(ba.position, 7)

  ba.clear()
  ba.writeByte(1)
  ba.writeShort(2)
  ba.length = 3
  tape.equal(ba.buffer[0], 1)
  tape.equal(ba.buffer[2], 2)
  tape.equal(ba.length, 3)
  ba.writeUTF('Hello')

  ba.position = 0
  tape.equal(ba.readByte(), 1)
  tape.equal(ba.readShort(), 2)
  tape.equal(ba.readUTF(), 'Hello')

  ba.clear()
  ba.length = 1
  ba.writeInt(5)
  ba.writeUTFBytes('Hello')
  ba.position = 0
  tape.equal(ba.readInt(), 5)
  tape.equal(ba.readUTFBytes(5), 'Hello')

  ba.clear()
  ba.length = 2
  ba.writeInt(5)
  ba.writeUTFBytes('Hello')
  ba.position = 0
  tape.equal(ba.readInt(), 5)
  tape.equal(ba.readUTFBytes(5), 'Hello')

  ba.clear()
  ba.length = 1
  ba.writeDouble(5)
  ba.writeUTFBytes('Hello')
  ba.position = 0
  tape.equal(ba.readDouble(), 5)
  tape.equal(ba.readUTFBytes(5), 'Hello')

  tape.end()
})
