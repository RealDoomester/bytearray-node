# ByteArray-node

This is a Node.js implementation of the Actionscript 3 ByteArray.

# Installation

`npm install bytearray-node`

# Usage

This library is the same as the ByteArray in Actionscript 3.

```javascript
const ByteArray = require("bytearray-node")

const ba = new ByteArray()

ba.writeByte(1)

ba.position = 0

console.log(ba.readByte()) // 1
```

For more tests and examples, see `/test/`.
