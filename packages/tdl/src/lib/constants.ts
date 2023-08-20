import { IntegerDescriptor } from './descriptors'

export const LITTLE_ENDIAN = true

export const ByteLengths = {
  Int8: 1,
  Int16: 2,
  Int32: 4,
  Int64: 8,
}

export const Uint8Descriptor: IntegerDescriptor = {
  type: 'integer',
  signed: false,
  bits: 8,
}

export const Uint16Descriptor: IntegerDescriptor = {
  type: 'integer',
  signed: false,
  bits: 16,
}

export const Uint32Descriptor: IntegerDescriptor = {
  type: 'integer',
  signed: false,
  bits: 32,
}

export const Int8Descriptor: IntegerDescriptor = {
  type: 'integer',
  signed: true,
  bits: 8,
}

export const Int16Descriptor: IntegerDescriptor = {
  type: 'integer',
  signed: true,
  bits: 16,
}

export const Int32Descriptor: IntegerDescriptor = {
  type: 'integer',
  signed: true,
  bits: 32,
}
