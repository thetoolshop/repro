import { approxByteLength } from '@repro/typed-binary-encoder'
import { nanoid } from 'nanoid'
import { SyntheticId } from './common'
import {
  CORRELATION_ID_BYTE_LENGTH,
  FetchRequest,
  FetchRequestView,
  FetchResponse,
  FetchResponseView,
  NetworkMessageType,
  RequestType,
  WebSocketClose,
  WebSocketCloseView,
  WebSocketInbound,
  WebSocketInboundView,
  WebSocketMessageType,
  WebSocketOpen,
  WebSocketOpenView,
  WebSocketOutbound,
  WebSocketOutboundView,
} from './network'

function createCorrelationId(): SyntheticId {
  return nanoid(CORRELATION_ID_BYTE_LENGTH)
}

function encodeBody(body: string): ArrayBuffer {
  return new TextEncoder().encode(body).buffer
}

describe('Network codecs', () => {
  it('should create a binary view for a fetch request', () => {
    const input: FetchRequest = {
      type: NetworkMessageType.FetchRequest,
      correlationId: createCorrelationId(),
      requestType: RequestType.Fetch,
      url: 'http://example.com/path/to/resource',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: encodeBody('{ "foo": "bar" }'),
    }

    const buffer = FetchRequestView.encode(input)
    const view = FetchRequestView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a fetch response', () => {
    const input: FetchResponse = {
      type: NetworkMessageType.FetchResponse,
      correlationId: createCorrelationId(),
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: encodeBody('{ "bar": "baz" }'),
    }

    const buffer = FetchResponseView.encode(input)
    const view = FetchResponseView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a WebSocket Open', () => {
    const input: WebSocketOpen = {
      type: NetworkMessageType.WebSocketOpen,
      correlationId: createCorrelationId(),
      url: 'ws://example.com/path/to/resource',
    }

    const buffer = WebSocketOpenView.encode(input)
    const view = WebSocketOpenView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a WebSocket Close', () => {
    const input: WebSocketClose = {
      type: NetworkMessageType.WebSocketClose,
      correlationId: createCorrelationId(),
    }

    const buffer = WebSocketCloseView.encode(input)
    const view = WebSocketCloseView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a WebSocket inbound message', () => {
    const input: WebSocketInbound = {
      type: NetworkMessageType.WebSocketInbound,
      correlationId: createCorrelationId(),
      messageType: WebSocketMessageType.Text,
      data: encodeBody('{ "foo": "bar" }'),
    }

    const buffer = WebSocketInboundView.encode(input)
    const view = WebSocketInboundView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a WebSocket outbound message', () => {
    const input: WebSocketOutbound = {
      type: NetworkMessageType.WebSocketOutbound,
      correlationId: createCorrelationId(),
      messageType: WebSocketMessageType.Text,
      data: encodeBody('{ "foo": "bar" }'),
    }

    const buffer = WebSocketOutboundView.encode(input)
    const view = WebSocketOutboundView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })
})
