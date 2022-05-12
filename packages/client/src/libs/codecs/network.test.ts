import { nanoid } from 'nanoid'
import {
  FetchRequest,
  FetchResponse,
  RequestType,
  NetworkEventType,
  WebSocketOpen,
  WebSocketClose,
  WebSocketInbound,
  WebSocketOutbound,
  BinaryType,
} from '@/types/network'
import {
  CONNECTION_ID_BYTE_LENGTH,
  CORRELATION_ID_BYTE_LENGTH,
  decodeNetworkEvent,
  encodeNetworkEvent,
} from './network'
import { LITTLE_ENDIAN } from './common'
import { approxByteLength } from '../record/buffer-utils'
import { BufferReader } from 'arraybuffer-utils'
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
  it('should encode and decode a fetch request', () => {
    const input: FetchRequest = {
      type: NetworkEventType.FetchRequest,
      correlationId: createCorrelationId(),
      requestType: RequestType.Fetch,
      url: 'http://example.com/path/to/resource',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: encodeBody('{ "foo": "bar" }'),
    }

    const buffer = encodeNetworkEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeNetworkEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode and fetch response', () => {
    const input: FetchResponse = {
      type: NetworkEventType.FetchResponse,
      correlationId: createCorrelationId(),
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: encodeBody('{ "bar": "baz" }'),
    }

    const buffer = encodeNetworkEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeNetworkEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode a WebSocket open', () => {
    const input: WebSocketOpen = {
      type: NetworkEventType.WebSocketOpen,
      connectionId: createConnectionId(),
      url: 'ws://example.com/path/to/resource',
    }

    const buffer = encodeNetworkEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeNetworkEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode a WebSocket close', () => {
    const input: WebSocketClose = {
      type: NetworkEventType.WebSocketClose,
      connectionId: createConnectionId(),
    }

    const buffer = encodeNetworkEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeNetworkEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode a WebSocket inbound message', () => {
    const input: WebSocketInbound = {
      type: NetworkEventType.WebSocketInbound,
      connectionId: createConnectionId(),
      binaryType: BinaryType.Blob,
      data: encodeBody('{ "foo": "bar" }'),
    }

    const buffer = encodeNetworkEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeNetworkEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode a WebSocket outbound message', () => {
    const input: WebSocketOutbound = {
      type: NetworkEventType.WebSocketOutbound,
      connectionId: createConnectionId(),
      binaryType: BinaryType.Blob,
      data: encodeBody('{ "foo": "bar" }'),
    }

    const buffer = encodeNetworkEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeNetworkEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })
})
