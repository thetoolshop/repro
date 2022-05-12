import { SyntheticId } from '@/types/common'
import {
  FetchRequest,
  FetchResponse,
  RequestType,
  NetworkEvent,
  NetworkEventType,
  WebSocketClose,
  WebSocketInbound,
  WebSocketOpen,
  WebSocketOutbound,
} from '@/types/network'
import { BufferReader, BufferWriter } from 'arraybuffer-utils'
import {
  concat,
  getByteLength,
  LITTLE_ENDIAN,
  readString16,
  readString32,
  readString8,
  UINT_16,
  UINT_32,
  UINT_8,
  writeString16,
  writeString32,
  writeString8,
} from './common'

export const NETWORK_EVENT_TYPE_BYTE_LENGTH = 1
export const CORRELATION_ID_BYTE_LENGTH = 4
export const REQUEST_INITIATOR_BYTE_LENGTH = 1
export const CONNECTION_ID_BYTE_LENGTH = 4
export const BINARY_TYPE_BYTE_LENGTH = 1

function readNetworkEventType(reader: BufferReader): NetworkEventType {
  return reader.readUint8()
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function writeCorrelationId(writer: BufferWriter, correlationId: SyntheticId) {
  const bytes = textEncoder.encode(correlationId)

  if (bytes.byteLength !== CORRELATION_ID_BYTE_LENGTH) {
    throw new Error(
      `Network codec: invalid correlation ID (${correlationId}: ${bytes.byteLength} bytes)`
    )
  }

  for (const byte of bytes) {
    writer.writeUint8(byte)
  }
}

function readCorrelationId(reader: BufferReader): SyntheticId {
  const bytes: Array<number> = []

  for (let i = 0; i < CORRELATION_ID_BYTE_LENGTH; i++) {
    bytes.push(reader.readUint8())
  }

  return textDecoder.decode(new Uint8Array(bytes))
}

function writeConnectionId(writer: BufferWriter, connectionId: SyntheticId) {
  const bytes = textEncoder.encode(connectionId)

  if (bytes.byteLength !== CONNECTION_ID_BYTE_LENGTH) {
    throw new Error(
      `Network codec: invalid connection ID (${connectionId}: ${bytes.byteLength} bytes)`
    )
  }

  for (const byte of bytes) {
    writer.writeUint8(byte)
  }
}

function readConnectionId(reader: BufferReader): SyntheticId {
  const bytes: Array<number> = []

  for (let i = 0; i < CONNECTION_ID_BYTE_LENGTH; i++) {
    bytes.push(reader.readUint8())
  }

  return textDecoder.decode(new Uint8Array(bytes))
}

function writeRequestType(writer: BufferWriter, initiator: RequestType) {
  writer.writeUint8(initiator)
}

function readRequestType(reader: BufferReader): RequestType {
  return reader.readUint8()
}

export function encodeNetworkEvent(event: NetworkEvent): ArrayBuffer {
  switch (event.type) {
    case NetworkEventType.FetchRequest:
      return encodeFetchRequest(event)

    case NetworkEventType.FetchResponse:
      return encodeFetchResponse(event)

    case NetworkEventType.WebSocketOpen:
      return encodeWebSocketOpen(event)

    case NetworkEventType.WebSocketClose:
      return encodeWebSocketClose(event)

    case NetworkEventType.WebSocketInbound:
      return encodeWebSocketInbound(event)

    case NetworkEventType.WebSocketOutbound:
      return encodeWebSocketOutbound(event)
  }
}

export function decodeNetworkEvent(reader: BufferReader): NetworkEvent {
  const type = readNetworkEventType(reader)

  switch (type) {
    case NetworkEventType.FetchRequest:
      return decodeFetchRequest(reader)

    case NetworkEventType.FetchResponse:
      return decodeFetchResponse(reader)

    case NetworkEventType.WebSocketOpen:
      return decodeWebSocketOpen(reader)

    case NetworkEventType.WebSocketClose:
      return decodeWebSocketClose(reader)

    case NetworkEventType.WebSocketInbound:
      return decodeWebSocketInbound(reader)

    case NetworkEventType.WebSocketOutbound:
      return decodeWebSocketOutbound(reader)
  }
}

export function encodeFetchRequest(event: FetchRequest): ArrayBuffer {
  const headerEntries = Object.entries(event.headers)
  const headerByteLength = headerEntries.flatMap(([key, value]) => [
    UINT_8 + getByteLength(key),
    UINT_16 + getByteLength(value),
  ])
  const headerByteLengthTotal = headerByteLength.reduce(
    (acc, byteLength) => acc + byteLength,
    0
  )

  const byteLength =
    NETWORK_EVENT_TYPE_BYTE_LENGTH +
    CORRELATION_ID_BYTE_LENGTH +
    REQUEST_INITIATOR_BYTE_LENGTH +
    UINT_32 +
    getByteLength(event.url) +
    UINT_8 +
    getByteLength(event.method) +
    UINT_8 +
    headerByteLengthTotal

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(event.type)
  writeCorrelationId(writer, event.correlationId)
  writeRequestType(writer, event.requestType)
  writeString32(writer, event.url)
  writeString8(writer, event.method)

  writer.writeUint8(headerEntries.length)
  for (const [key, value] of headerEntries) {
    writeString8(writer, key)
    writeString16(writer, value)
  }

  return concat([
    buffer,
    new Uint32Array([event.body.byteLength]).buffer,
    event.body,
  ])
}

export function decodeFetchRequest(reader: BufferReader): FetchRequest {
  const type = NetworkEventType.FetchRequest
  const correlationId = readCorrelationId(reader)
  const requestType = readRequestType(reader)
  const url = readString32(reader)
  const method = readString8(reader)

  const headerLength = reader.readUint8()
  const headerEntries: Array<[string, string]> = []

  for (let i = 0; i < headerLength; i++) {
    headerEntries.push([readString8(reader), readString16(reader)])
  }

  const headers: Record<string, string> = headerEntries.reduce(
    (acc, entry) => ({ ...acc, [entry[0]]: entry[1] }),
    {}
  )

  const bodyLength = reader.readUint32()
  const bodyOffset = reader.getOffset()
  const body = reader.buffer.buffer.slice(bodyOffset, bodyLength)

  return {
    type,
    correlationId,
    requestType,
    url,
    method,
    headers,
    body,
  }
}

export function encodeFetchResponse(event: FetchResponse): ArrayBuffer {
  const headerEntries = Object.entries(event.headers)
  const headerByteLength = headerEntries.flatMap(([key, value]) => [
    UINT_8 + getByteLength(key),
    UINT_16 + getByteLength(value),
  ])
  const headerByteLengthTotal = headerByteLength.reduce(
    (acc, byteLength) => acc + byteLength,
    0
  )

  const byteLength =
    NETWORK_EVENT_TYPE_BYTE_LENGTH +
    CORRELATION_ID_BYTE_LENGTH +
    UINT_16 +
    UINT_8 +
    headerByteLengthTotal

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(event.type)
  writeCorrelationId(writer, event.correlationId)
  writer.writeUint16(event.status)

  writer.writeUint8(headerEntries.length)
  for (const [key, value] of headerEntries) {
    writeString8(writer, key)
    writeString16(writer, value)
  }

  return concat([
    buffer,
    new Uint32Array([event.body.byteLength]).buffer,
    event.body,
  ])
}

export function decodeFetchResponse(reader: BufferReader): FetchResponse {
  const type = NetworkEventType.FetchResponse
  const correlationId = readCorrelationId(reader)
  const status = reader.readUint16()

  const headerLength = reader.readUint8()
  const headerEntries: Array<[string, string]> = []

  for (let i = 0; i < headerLength; i++) {
    headerEntries.push([readString8(reader), readString16(reader)])
  }

  const headers: Record<string, string> = headerEntries.reduce(
    (acc, entry) => ({ ...acc, [entry[0]]: entry[1] }),
    {}
  )

  const bodyLength = reader.readUint32()
  const bodyOffset = reader.getOffset()
  const body = reader.buffer.buffer.slice(bodyOffset, bodyOffset + bodyLength)

  return {
    type,
    correlationId,
    status,
    headers,
    body,
  }
}

export function encodeWebSocketOpen(event: WebSocketOpen): ArrayBuffer {
  const byteLength =
    NETWORK_EVENT_TYPE_BYTE_LENGTH +
    CONNECTION_ID_BYTE_LENGTH +
    UINT_32 +
    getByteLength(event.url)

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(event.type)
  writeConnectionId(writer, event.connectionId)
  writeString32(writer, event.url)

  return buffer
}

export function decodeWebSocketOpen(reader: BufferReader): WebSocketOpen {
  const type = NetworkEventType.WebSocketOpen
  const connectionId = readConnectionId(reader)
  const url = readString32(reader)

  return {
    type,
    connectionId,
    url,
  }
}

export function encodeWebSocketClose(event: WebSocketClose): ArrayBuffer {
  const byteLength = NETWORK_EVENT_TYPE_BYTE_LENGTH + CONNECTION_ID_BYTE_LENGTH
  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(event.type)
  writeConnectionId(writer, event.connectionId)

  return buffer
}

export function decodeWebSocketClose(reader: BufferReader): WebSocketClose {
  const type = NetworkEventType.WebSocketClose
  const connectionId = readConnectionId(reader)

  return {
    type,
    connectionId,
  }
}

export function encodeWebSocketInbound(event: WebSocketInbound): ArrayBuffer {
  const byteLength =
    NETWORK_EVENT_TYPE_BYTE_LENGTH +
    CONNECTION_ID_BYTE_LENGTH +
    BINARY_TYPE_BYTE_LENGTH

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(event.type)
  writeConnectionId(writer, event.connectionId)
  writer.writeUint8(event.binaryType)

  return concat([
    buffer,
    new Uint32Array([event.data.byteLength]).buffer,
    event.data,
  ])
}

export function decodeWebSocketInbound(reader: BufferReader): WebSocketInbound {
  const type = NetworkEventType.WebSocketInbound
  const connectionId = readConnectionId(reader)
  const binaryType = reader.readUint8()

  const dataLength = reader.readUint32()
  const dataOffset = reader.getOffset()
  const data = reader.buffer.buffer.slice(dataOffset, dataOffset + dataLength)

  return {
    type,
    connectionId,
    binaryType,
    data,
  }
}

export function encodeWebSocketOutbound(event: WebSocketOutbound): ArrayBuffer {
  const byteLength =
    NETWORK_EVENT_TYPE_BYTE_LENGTH +
    CONNECTION_ID_BYTE_LENGTH +
    BINARY_TYPE_BYTE_LENGTH

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(event.type)
  writeConnectionId(writer, event.connectionId)
  writer.writeUint8(event.binaryType)

  return concat([
    buffer,
    new Uint32Array([event.data.byteLength]).buffer,
    event.data,
  ])
}

export function decodeWebSocketOutbound(
  reader: BufferReader
): WebSocketOutbound {
  const type = NetworkEventType.WebSocketOutbound
  const connectionId = readConnectionId(reader)
  const binaryType = reader.readUint8()

  const dataLength = reader.readUint32()
  const dataOffset = reader.getOffset()
  const data = reader.buffer.buffer.slice(dataOffset, dataOffset + dataLength)

  return {
    type,
    connectionId,
    binaryType,
    data,
  }
}
