import { webcrypto } from 'node:crypto'
import { TextDecoder, TextEncoder } from 'node:util'

// @ts-ignore
global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder

// @ts-ignore
global.crypto = webcrypto
