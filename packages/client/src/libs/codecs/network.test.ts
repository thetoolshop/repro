import { nanoid } from 'nanoid'
import {
  FetchRequest,
  FetchResponse,
  RequestType,
  NetworkMessageType,
  WebSocketOpen,
  WebSocketClose,
  WebSocketInbound,
  WebSocketOutbound,
  BinaryType,
} from '@/types/network'
import {
  CONNECTION_ID_BYTE_LENGTH,
  CORRELATION_ID_BYTE_LENGTH,
  FetchRequestView,
  FetchResponseView,
  WebSocketCloseView,
  WebSocketInboundView,
  WebSocketOpenView,
  WebSocketOutboundView,
} from './network'
import { approxByteLength } from '../record/buffer-utils'
import { SyntheticId } from '@/types/common'

function createCorrelationId(): SyntheticId {
  return nanoid(CORRELATION_ID_BYTE_LENGTH)
}

function createConnectionId(): SyntheticId {
  return nanoid(CONNECTION_ID_BYTE_LENGTH)
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
      connectionId: createConnectionId(),
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
      connectionId: createConnectionId(),
    }

    const buffer = WebSocketCloseView.encode(input)
    const view = WebSocketCloseView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a WebSocket inbound message', () => {
    const input: WebSocketInbound = {
      type: NetworkMessageType.WebSocketInbound,
      connectionId: createConnectionId(),
      binaryType: BinaryType.Blob,
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
      connectionId: createConnectionId(),
      binaryType: BinaryType.Blob,
      data: encodeBody('{ "foo": "bar" }'),
    }

    const buffer = WebSocketOutboundView.encode(input)
    const view = WebSocketOutboundView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })
})
