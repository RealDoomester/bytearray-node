# ByteArray-node

[![npm version](https://img.shields.io/npm/v/bytearray-node?style=flat-square)](https://www.npmjs.com/package/bytearray-node)

A Node.js implementation of the Actionscript 3 ByteArray supporting AMF0/AMF3.

# Installation

`npm install bytearray-node`

# Usage

For extended usage, see [here](https://github.com/Zaseth/bytearray-node/tree/master/test)

```javascript
const ByteArray = require('bytearray-node')
const Endian = require('bytearray-node/enums/Endian')
const ObjectEncoding = require('bytearray-node/enums/ObjectEncoding')
const CompressionAlgorithm = require('bytearray-node/enums/CompressionAlgorithm')

const ba = new ByteArray()
//ba.endian = Endian.BIG_ENDIAN
//ba.endian = Endian.LITTLE_ENDIAN

//ba.objectEncoding = ObjectEncoding.AMF0
//ba.objectEncoding = ObjectEncoding.AMF3

//CompressionAlgorithm.DEFLATE
//CompressionAlgorithm.LZMA
//CompressionAlgorithm.ZLIB

ba.writeByte(1)
ba.writeShort(5)

ba.position = 0

console.log(ba.readByte()) // 1
console.log(ba.readShort()) // 5
```
