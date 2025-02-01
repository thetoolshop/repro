import { webcrypto } from 'node:crypto'
import { TextDecoder, TextEncoder } from 'node:util'

// @ts-ignore
global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder

// @ts-ignore
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: true,
  configurable: true,
  enumerable: true,
})
