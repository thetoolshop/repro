import { AnyDescriptor } from './any'
import { StructDescriptor } from './struct'

export const LITTLE_ENDIAN = true

export function createDataView(byteLength: number): DataView {
  return new DataView(new ArrayBuffer(byteLength))
}

export function createPointerRef(offset = 0) {
  return { offset }
}

export type PointerRef = ReturnType<typeof createPointerRef>

const u8_bytes = 1
const u16_bytes = 2
const u32_bytes = 4

export function getByteLength(descriptor: AnyDescriptor, data: any): number {
  const { type, nullable } = descriptor

  if (nullable && data === null) {
    return u8_bytes
  }

  if (type === 'char') {
    return (nullable ? u8_bytes : 0) + descriptor.bytes
  }

  if (type === 'bool') {
    return (nullable ? u8_bytes : 0) + u8_bytes
  }

  if (type === 'integer') {
    return (nullable ? u8_bytes : 0) + descriptor.bits / 8
  }

  if (type === 'buffer') {
    return (nullable ? u8_bytes : 0) + u32_bytes + data.byteLength
  }

  if (type === 'string') {
    let byteLength = (nullable ? u8_bytes : 0) + u32_bytes

    if (typeof data === 'string') {
      for (let i = 0, len = data.length; i < len; i++) {
        const codePoint = data.codePointAt(i)

        if (codePoint === undefined) {
          continue
        }

        if (codePoint < 0x0080) {
          byteLength += u8_bytes
        } else if (codePoint < 0x0800) {
          byteLength += u16_bytes
        } else if (codePoint < 0x10000) {
          byteLength += u8_bytes + u16_bytes
        } else {
          byteLength += u32_bytes
        }
      }
    }

    return byteLength
  }

  if (type === 'array') {
    return (
      (nullable ? u8_bytes : 0) +
      descriptor.size * getByteLength(descriptor.items, data[0])
    )
  }

  if (type === 'vector') {
    return (
      (nullable ? u8_bytes : 0) +
      u32_bytes +
      data.length * u32_bytes +
      (data as any[])
        .map(item => getByteLength(descriptor.items, item))
        .reduce((a, b) => a + b, 0)
    )
  }

  if (type === 'struct') {
    return (
      (nullable ? u8_bytes : 0) +
      descriptor.fields.length * u32_bytes +
      descriptor.fields
        .map(([name, fieldDescriptor]) =>
          getByteLength(fieldDescriptor, data[name])
        )
        .reduce((a, b) => a + b, 0)
    )
  }

  if (type === 'dict') {
    const entries = Object.entries(data)

    const keysByteLength = entries
      .flatMap(([key]) => [getByteLength(descriptor.key, key), u32_bytes])
      .reduce((a, b) => a + b, 0)

    const valuesByteLength = entries
      .map(([, value]) => getByteLength(descriptor.value, value))
      .reduce((a, b) => a + b, 0)

    return (
      (nullable ? u8_bytes : 0) + u32_bytes + keysByteLength + valuesByteLength
    )
  }

  if (type === 'union') {
    const { descriptors, tagField } = descriptor
    const childDescriptor = descriptors[data[tagField]] as StructDescriptor
    return (
      (nullable ? u8_bytes : 0) +
      u8_bytes +
      getByteLength(childDescriptor, data)
    )
  }

  return 0
}
