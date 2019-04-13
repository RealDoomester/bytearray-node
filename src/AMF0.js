"use strict"

const Markers = {
  NUMBER: 0,
  BOOLEAN: 1,
  STRING: 2,
  OBJECT: 3,
  //MOVIECLIP: 4,
  NULL: 5,
  UNDEFINED: 6,
  //REFERENCE: 7,
  ECMA_ARRAY: 8,
  OBJECT_END: 9,
  STRICT_ARRAY: 10,
  DATE: 11,
  LONG_STRING: 12,
  //UNSUPPORTED: 13,
  //RECORD_SET: 14,
  //XML_DOCUMENT: 15,
  TYPED_OBJECT: 16
}

module.exports = class AMF0 {
  /**
   * Construct a new AMF0 class
   * @constructor
   * @class
   * @param {ByteArray} byteArr
   */
  constructor(byteArr) {
    /**
     * The ByteArray
     * @type {ByteArray}
     */
    this.byteArr = byteArr
    /**
     * The class aliases
     * @type {Array<?>}
     */
    this.classAliases = []
  }

  /**
   * Registers a class alias
   * @param {String} aliasName
   * @param {Class} classObject
   */
  registerClassAlias(aliasName, classObject) {
    if (this.classAliases[aliasName] !== classObject) {
      this.classAliases[aliasName] = classObject
    }
  }

  /**
   * Serializes an AMF0 value
   * @param {?} value
   * @param {Boolean} strMarker
   */
  serializeValue(value, strMarker = true) {
    if (value === undefined) {
      this.byteArr.writeByte(Markers.UNDEFINED)
    } else if (value === null) {
      this.byteArr.writeByte(Markers.NULL)
    } else {
      const type = typeof value

      if (type === "number") {
        this.byteArr.writeByte(Markers.NUMBER)
        this.byteArr.writeDouble(value)
      } else if (type === "boolean") {
        this.byteArr.writeByte(Markers.BOOLEAN)
        this.byteArr.writeBoolean(value)
      } else if (type === "string") {
        if (value.length >> 16) {
          if (strMarker) {
            this.byteArr.writeByte(Markers.LONG_STRING)
          }

          this.byteArr.writeUnsignedInt(value.length)
        } else {
          if (strMarker) {
            this.byteArr.writeByte(Markers.STRING)
          }

          this.byteArr.writeUTF(value)
        }
      } else if (type === "object") {
        const funcName = value.constructor

        if (funcName === Object) {
          this.byteArr.writeByte(Markers.OBJECT)

          for (const key in value) {
            this.serializeValue(key, false)
            this.serializeValue(value[key])
          }

          this.byteArr.writeUTF("")
          this.byteArr.writeByte(Markers.OBJECT_END)
        } else if (funcName === Array) {
          this.byteArr.writeByte(Markers.ECMA_ARRAY)
          this.byteArr.writeUnsignedInt(value.length)

          for (const key in value) {
            this.serializeValue(key, false)
            this.serializeValue(value[key])
          }

          this.byteArr.writeUTF("")
          this.byteArr.writeByte(Markers.OBJECT_END)
        } else if (funcName === Date) {
          this.byteArr.writeByte(Markers.DATE)
          this.byteArr.writeDouble(value.getTime())
          this.byteArr.writeShort(value.getTimezoneOffset())
        } else {
          // If there's class aliases registered
          if (Object.keys(this.classAliases).length > 0) {
            let alias = ""

            // Check if the value we're writing is registered
            for (const aliasName in this.classAliases) {
              // If so, copy it
              if (this.classAliases[aliasName].name.toString() === funcName.name.toString()) {
                alias = aliasName
              }
            }

            this.byteArr.writeByte(Markers.TYPED_OBJECT)
            this.byteArr.writeUTF(alias)
          } else { // Nothing registered, switch to an object
            this.byteArr.writeByte(Markers.OBJECT)
          }

          for (const key in value) {
            this.serializeValue(key, false)
            this.serializeValue(value[key])
          }

          this.byteArr.writeUTF("")
          this.byteArr.writeByte(Markers.OBJECT_END)
        }
      } else {
        throw new TypeError(`Unknown AMF0 value type: ${type}`)
      }
    }
  }

  /**
   * Deserializes an AMF0 value
   * @returns {?}
   */
  deserializeValue() {
    const marker = this.byteArr.readByte()

    if (Markers.UNDEFINED === marker) {
      return undefined
    } else if (Markers.NULL === marker) {
      return null
    } else if (Markers.NUMBER === marker) {
      return this.byteArr.readDouble()
    } else if (Markers.BOOLEAN === marker) {
      return this.byteArr.readBoolean()
    } else if (Markers.STRING === marker) {
      return this.byteArr.readUTF()
    } else if (Markers.OBJECT === marker) {
      const value = {}

      for (let key = this.byteArr.readUTF(); key !== ""; key = this.byteArr.readUTF()) {
        value[key] = this.deserializeValue()
      }

      // Consume last 8 bits
      if (Markers.OBJECT_END !== this.byteArr.readByte()) {
        throw new RangeError("Couldn't deserialize the entire buffer as the object-end marker wasn't found")
      }

      return value
    } else if (Markers.ECMA_ARRAY === marker) {
      const value = {}

      for (let key = this.byteArr.readUTF(); key !== ""; key = this.byteArr.readUTF()) {
        value[key] = this.deserializeValue()
      }

      // Consume the last 8 bits
      if (Markers.OBJECT_END !== this.byteArr.readByte()) {
        throw new RangeError("Couldn't deserialize the entire buffer as the object-end marker wasn't found")
      }

      return value
    } else if (Markers.STRICT_ARRAY === marker) {
      const value = []
      const len = this.byteArr.readUnsignedInt()

      for (let i = 0; i < len; i++) {
        value[i] = this.deserializeValue()
      }

      return value
    } else if (Markers.DATE === marker) {
      const value = new Date(this.byteArr.readDouble())

      // Consume the last unused 16 bits
      this.byteArr.readShort()

      return value
    } else if (Markers.LONG_STRING === marker) {
      return this.byteArr.readUTFBytes(this.byteArr.readUnsignedInt())
    } else if (Markers.TYPED_OBJECT === marker) {
      // Get the class by aliasName
      let classAlias = this.classAliases[this.byteArr.readUTF()]

      if (!classAlias) {
        throw new Error("Deserialized an unexisting AMF0 class alias")
      }

      // Construct the class with it's keys
      classAlias = new classAlias()

      for (let key = this.byteArr.readUTF(); key !== ""; key = this.byteArr.readUTF()) {
        classAlias[key] = this.deserializeValue()
      }

      // Consume the last 8 bits
      if (Markers.OBJECT_END !== this.byteArr.readByte()) {
        throw new RangeError("Couldn't deserialize the entire buffer as the object-end marker wasn't found")
      }

      return classAlias
    } else {
      throw new TypeError(`Unknown AMF0 marker: ${marker}`)
    }
  }
}
