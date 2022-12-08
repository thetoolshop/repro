import {
  LITTLE_ENDIAN,
  PointerRef,
  createDataView,
  createPointerRef,
  getByteLength,
} from './common'

export interface IntegerDescriptor {
  type: 'integer'
  signed: boolean
  bits: 8 | 16 | 32
  nullable?: boolean
}

export const UINT8: IntegerDescriptor = {
  type: 'integer',
  signed: false,
  bits: 8,
}

export const UINT16: IntegerDescriptor = {
  type: 'integer',
  signed: false,
  bits: 16,
}

export const UINT32: IntegerDescriptor = {
  type: 'integer',
  signed: false,
  bits: 32,
}

export const INT8: IntegerDescriptor = {
  type: 'integer',
  signed: true,
  bits: 8,
}

export const INT16: IntegerDescriptor = {
  type: 'integer',
  signed: true,
  bits: 16,
}

export const INT32: IntegerDescriptor = {
  type: 'integer',
  signed: true,
  bits: 32,
}

export function getInteger(
  descriptor: IntegerDescriptor,
  view: DataView,
  byteOffset: number
) {
  const { signed, bits } = descriptor
  const method = `get${signed ? 'Int' : 'Uint'}${bits}` as const
  const data = view[method](byteOffset, LITTLE_ENDIAN)
  byteOffset += bits / 8
  return data
}

export function encodeInteger(
  descriptor: IntegerDescriptor,
  data: number,
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  const { signed, bits } = descriptor
  const method = `set${signed ? 'Int' : 'Uint'}${bits}` as const
  view[method](pointerRef.offset, data, LITTLE_ENDIAN)
  pointerRef.offset += bits / 8
  return view
}
