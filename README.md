# ByteArray-node

[![npm version](https://img.shields.io/npm/v/bytearray-node?style=flat-square)](https://www.npmjs.com/package/bytearray-node)

A Node.js implementation of the Actionscript 3 ByteArray supporting AMF0/AMF3.

# Installation

`npm install bytearray-node`

# API

* [Adobe API](https://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/utils/ByteArray.html)

# Usage

```js
const ByteArray = require('bytearray-node')
const { Endian, ObjectEncoding, CompressionAlgorithm } = require('bytearray-node/enums/')

class Person {
  constructor(name, age) {
    this.name = name
    this.age = age
  }
}

class Character {
  constructor(username, password) {
    this.username = username
    this.password = password
  }

  writeExternal(output) {
    output.writeUTF(this.username)
    output.writeUTF(this.password)
  }

  readExternal(input) {
    this.username = input.readUTF()
    this.password = input.readUTF()
  }
}

ByteArray.registerClassAlias(ObjectEncoding.AMF3, 'src.Person', Person)
ByteArray.registerClassAlias(ObjectEncoding.AMF3, 'src.Character', Character)

const ba = new ByteArray()

ba.objectEncoding = ObjectEncoding.AMF3
ba.endian = Endian.BIG_ENDIAN

ba.writeByte(100)
ba.writeObject(new Person('Zaseth', 18))
ba.writeObject(new Character('Zaseth', '123123'))

ba.position = 0

console.log(ba.readByte())
console.log(ba.readObject())
console.log(ba.readObject())

```
