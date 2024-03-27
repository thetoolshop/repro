import { TextDecoder, TextEncoder } from 'util'

declare global {
  var TextDecoder: {
    new (): TextDecoder
  }

  var TextEncoder: {
    new (): TextEncoder
  }
}

global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder
