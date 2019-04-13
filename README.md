# ByteArray-node

A Node.js implementation of the Actionscript 3 ByteArray supporting AMF0. I made this library so that Actionscript developers using ByteArray in their application are more likely to switch to Node.js. This library is exactly the same as the one in Actionscript, so it's very easy!

# Installation

`npm install bytearray-node`

# Usage

```javascript
const ByteArray = require("bytearray-node")
const ba = new ByteArray()

ba.writeByte(1)
ba.writeShort(5)

ba.position = 0

console.log(ba.readByte()) // 1
```

# AMF0 usage

```javascript
const ByteArray = require("bytearray-node")

class Person {
  constructor(name, age) {
    this.name = name
    this.age = age
  }
}

const ba = new ByteArray()

ba.registerClassAlias("com.person", Person)
ba.writeObject(new Person("Daan", 17))

ba.position = 0

console.log(ba.readObject()) // Person { name: 'Daan', age: 17 }
```
