import { BufferReader, BufferWriter } from 'arraybuffer-utils'

export const HEADER_8 = 1
export const HEADER_16 = 2
export const HEADER_32 = 4

export const LITTLE_ENDIAN = true

export function concat(buffers: Array<ArrayBuffer>): ArrayBuffer {
  const size = buffers.reduce((acc, buf) => acc + buf.byteLength, 0)
  const dest = new ArrayBuffer(size)
  const writer = new BufferWriter(dest, 0, LITTLE_ENDIAN)

  for (const buffer of buffers) {
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)

    for (let i = 0; i < reader.getSize(); i++) {
      writer.writeUint8(reader.readUint8())
    }
  }

  return dest
}

export function zeroFill(writer: BufferWriter, byteLength: number) {
  for (let i = 0; i < byteLength; i++) {
    writer.writeUint8(0)
  }
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export function getByteLength(chars: string): number {
  return textEncoder.encode(chars).byteLength
}

export function writeString8(writer: BufferWriter, chars: string) {
  const bytes = textEncoder.encode(chars)
  writer.writeUint8(bytes.byteLength)

  for (const byte of bytes) {
    writer.writeUint8(byte)
  }
}

export function readString8(reader: BufferReader): string {
  const byteLength = reader.readUint8()
  const bytes: Array<number> = []

  for (let i = 0; i < byteLength; i++) {
    bytes.push(reader.readUint8())
  }

  return textDecoder.decode(new Uint8Array(bytes))
}

export function writeString16(writer: BufferWriter, chars: string) {
  const bytes = textEncoder.encode(chars)
  writer.writeUint16(bytes.byteLength)

  for (const byte of bytes) {
    writer.writeUint8(byte)
  }
}

export function readString16(reader: BufferReader): string {
  const byteLength = reader.readUint16()
  const bytes: Array<number> = []

  for (let i = 0; i < byteLength; i++) {
    bytes.push(reader.readUint8())
  }

  return textDecoder.decode(new Uint8Array(bytes))
}

export function writeString32(writer: BufferWriter, chars: string) {
  const bytes = textEncoder.encode(chars)
  writer.writeUint32(bytes.byteLength)

  for (const byte of bytes) {
    writer.writeUint8(byte)
  }
}

export function readString32(reader: BufferReader): string {
  const byteLength = reader.readUint32()
  const bytes: Array<number> = []

  for (let i = 0; i < byteLength; i++) {
    bytes.push(reader.readUint8())
  }

  return textDecoder.decode(new Uint8Array(bytes))
}
