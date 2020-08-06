'use strict'

/**
 * @exports
 */
module.exports = {
  AMF0: {
    NUMBER: 0x00,
    BOOLEAN: 0x01,
    STRING: 0x02,
    OBJECT: 0x03,
    NULL: 0x05,
    UNDEFINED: 0x06,
    REFERENCE: 0x07,
    ECMA_ARRAY: 0x08,
    OBJECT_END: 0x09,
    STRICT_ARRAY: 0x0A, // Read only, write is for remote
    DATE: 0x0B,
    LONG_STRING: 0x0C,
    SET: 0x0E, // Recordset
    TYPED_OBJECT: 0x10,
    AVMPLUS: 0x11
  },
  AMF3: {
    UNDEFINED: 0x00,
    NULL: 0x01,
    FALSE: 0x02,
    TRUE: 0x03,
    INT: 0x04,
    DOUBLE: 0x05,
    STRING: 0x06,
    DATE: 0x08,
    ARRAY: 0x09,
    OBJECT: 0x0A,
    BYTEARRAY: 0x0C,
    DICTIONARY: 0x11,
    VECTOR_INT: 0x0D,
    VECTOR_UINT: 0x0E,
    VECTOR_DOUBLE: 0x0F
  }
}
