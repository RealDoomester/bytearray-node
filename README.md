# ByteArray-node

[![npm version](https://img.shields.io/npm/v/bytearray-node?style=flat-square)](https://www.npmjs.com/package/bytearray-node)

A Node.js implementation of the Actionscript 3 ByteArray supporting AMF0/AMF3.

# Installation

- Tools for Native Modules installed in Node.js setup
- `npm install bytearray-node`

# API (please see this)

* [Adobe API](https://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/utils/ByteArray.html)
* [Library API](https://github.com/Zaseth/bytearray-node/wiki)
* [Tests](https://github.com/Zaseth/bytearray-node/tree/master/test)

# Usage example

```javascript
const ByteArray = require('bytearray-node')

const ba = new ByteArray()

ba.writeByte(1)
ba.writeShort(5)

ba.position = 0

console.log(ba.readByte()) // 1
console.log(ba.readShort()) // 5
```

# AMF3 IExternalizable example

```javascript
const ByteArray = require('bytearray-node')
const IExternalizable = require('bytearray-node/enums/IExternalizable')

class Person extends IExternalizable {
  constructor(name, age) {
    super()

    this.name = name
    this.age = age
  }

  writeExternal(ba) {
    ba.writeUTF(this.name)
    ba.writeByte(this.age)
  }

  readExternal(ba) {
    this.name = ba.readUTF()
    this.age = ba.readByte()
  }
}

ByteArray.registerClassAlias('src.person', Person)

const ba = new ByteArray()

ba.writeObject(new Person('Daan', 18))

ba.position = 0

console.log(ba.readObject()) // Person { name: 'Daan', age: 18 }
```
