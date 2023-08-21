import {
  Int16Descriptor,
  Int32Descriptor,
  Int8Descriptor,
  Uint16Descriptor,
  Uint32Descriptor,
  Uint8Descriptor,
} from './lib/constants'

export * as z from 'zod'
export * from './lib/descriptors'
// These probably don't belong as exports from this module
export { approxByteLength, copy } from './lib/utils'
export * from './lib/view'

// Temporary exports for backwards compatibility
// TODO: Remove these once domain module uses generated code
export const UINT8 = Uint8Descriptor
export const UINT16 = Uint16Descriptor
export const UINT32 = Uint32Descriptor
export const INT8 = Int8Descriptor
export const INT16 = Int16Descriptor
export const INT32 = Int32Descriptor
