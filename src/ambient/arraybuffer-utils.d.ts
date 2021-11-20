declare module 'arraybuffer-utils' {
  export class BufferReader {
    constructor(
      buffer: ArrayBuffer,
      offset?: number,
      isLittleEndian?: boolean
    ): BufferReader
    /** @deprecated Read uint8 stream and decode with TextDecoder */
    readString(): string
    /** @deprecated Read uint8 stream and decode with TextDecoder */
    readChar(): string
    readInt8(): number
    readUint8(): number
    readInt16(): number
    readUint16(): number
    readInt32(): number
    readUint32(): number
    readFloat32(): number
    readFloat64(): number
    useLittleEndian(): this
    useBigEndian(): this
    isLittleEndian(): boolean
    isBigEndian(): boolean
    getSize(): number
    getOffset(): number
  }

  export class BufferWriter {
    constructor(
      buffer: ArrayBuffer,
      offset?: number,
      isLittleEndian?: boolean
    ): BufferWriter
    /** @deprecated Use TextEncoder and write stream of uint8 */
    writeString(str: string): this
    /** @deprecated Use TextEncoder and write stream of uint8 */
    writeChar(char: string): this
    writeInt8(int: number): this
    writeUint8(int: number): this
    writeInt16(int: number): this
    writeUint16(int: number): this
    writeInt32(int: number): this
    writeUint32(int: number): this
    writeFloat32(int: number): this
    writeFloat64(int: number): this
    useLittleEndian(): this
    useBigEndian(): this
    isLittleEndian(): boolean
    isBigEndian(): boolean
    getSize(): number
    getOffset(): number
  }
}
