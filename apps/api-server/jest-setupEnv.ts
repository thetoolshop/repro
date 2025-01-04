import { ReadableStream } from 'stream/web'
import { TextDecoder, TextEncoder } from 'util'

declare global {
  var TextDecoder: {
    new (): TextDecoder
  }

  var TextEncoder: {
    new (): TextEncoder
  }

  var ReadableStream: {
    new (): ReadableStream
  }
}

global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder
global.ReadableStream = ReadableStream
