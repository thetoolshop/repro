import * as stream from 'node:stream/web'
import { TextDecoder, TextEncoder } from 'util'

declare global {
  var TextDecoder: {
    new (): TextDecoder
  }

  var TextEncoder: {
    new (): TextEncoder
  }

  export type ReadableStream<R = any> = stream.ReadableStream<R>

  var ReadableStream: {
    prototype: ReadableStream
    new (
      underlyingSource: stream.UnderlyingByteSource,
      strategy?: stream.QueuingStrategy<Uint8Array>
    ): ReadableStream<Uint8Array>
    new <R = any>(
      underlyingSource?: stream.UnderlyingSource<R>,
      strategy?: stream.QueuingStrategy<R>
    ): ReadableStream<R>
  }

  export type WritableStream<W = any> = stream.WritableStream<W>

  var WritableStream: {
    prototype: WritableStream
    new <W = any>(
      underlyingSink?: stream.UnderlyingSink<W>,
      strategy?: stream.QueuingStrategy<W>
    ): WritableStream<W>
  }
}

global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder

global.ReadableStream = stream.ReadableStream
global.WritableStream = stream.WritableStream
