# ByteArray-node

[![npm version](https://img.shields.io/npm/v/bytearray-node?style=flat-square)](https://www.npmjs.com/package/bytearray-node)

A Node.js implementation of the Actionscript 3 ByteArray supporting AMF0/AMF3.

# Installation

`npm install bytearray-node`

# Usage

```javascript
const ByteArray = require('bytearray-node')
const ba = new ByteArray()

ba.writeByte(1)
ba.writeShort(5)

ba.position = 0

console.log(ba.readByte()) // 1
console.log(ba.readShort()) // 5
```
