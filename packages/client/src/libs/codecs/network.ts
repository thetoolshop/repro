import { SyntheticId } from '@/types/common'
import {
  FetchRequest,
  FetchResponse,
  RequestType,
  NetworkMessage,
  NetworkMessageType,
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

export function readNetworkEventType(reader: BufferReader): NetworkMessageType {
  return reader.readUint8()
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export function writeCorrelationId(
  writer: BufferWriter,
  correlationId: SyntheticId
) {
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

export function readCorrelationId(reader: BufferReader): SyntheticId {
  const bytes: Array<number> = []

  for (let i = 0; i < CORRELATION_ID_BYTE_LENGTH; i++) {
    bytes.push(reader.readUint8())
  }

  return textDecoder.decode(new Uint8Array(bytes))
}

export function writeConnectionId(
  writer: BufferWriter,
  connectionId: SyntheticId
) {
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

export function readConnectionId(reader: BufferReader): SyntheticId {
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

export function encodeNetworkMessage(message: NetworkMessage): ArrayBuffer {
  switch (message.type) {
    case NetworkMessageType.FetchRequest:
      return encodeFetchRequest(message)

    case NetworkMessageType.FetchResponse:
      return encodeFetchResponse(message)

    case NetworkMessageType.WebSocketOpen:
      return encodeWebSocketOpen(message)

    case NetworkMessageType.WebSocketClose:
      return encodeWebSocketClose(message)

    case NetworkMessageType.WebSocketInbound:
      return encodeWebSocketInbound(message)

    case NetworkMessageType.WebSocketOutbound:
      return encodeWebSocketOutbound(message)
  }
}

export function decodeNetworkMessage(reader: BufferReader): NetworkMessage {
  const type = readNetworkEventType(reader)

  switch (type) {
    case NetworkMessageType.FetchRequest:
      return decodeFetchRequest(reader)

    case NetworkMessageType.FetchResponse:
      return decodeFetchResponse(reader)

    case NetworkMessageType.WebSocketOpen:
      return decodeWebSocketOpen(reader)

    case NetworkMessageType.WebSocketClose:
      return decodeWebSocketClose(reader)

    case NetworkMessageType.WebSocketInbound:
      return decodeWebSocketInbound(reader)

    case NetworkMessageType.WebSocketOutbound:
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
  const type = NetworkMessageType.FetchRequest
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
    ArrayBuffer.isView(event.body) ? event.body.buffer : event.body,
  ])
}

export function decodeFetchResponse(reader: BufferReader): FetchResponse {
  const type = NetworkMessageType.FetchResponse
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
  const body = new ArrayBuffer(bodyLength)
  const bodyWriter = new BufferWriter(body, 0, LITTLE_ENDIAN)

  for (let i = 0; i < bodyLength; i++) {
    bodyWriter.writeUint8(reader.readUint8())
  }

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
  const type = NetworkMessageType.WebSocketOpen
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
  const type = NetworkMessageType.WebSocketClose
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
  const type = NetworkMessageType.WebSocketInbound
  const connectionId = readConnectionId(reader)
  const binaryType = reader.readUint8()

  const dataLength = reader.readUint32()
  const data = new ArrayBuffer(dataLength)
  const dataWriter = new BufferWriter(data, 0, LITTLE_ENDIAN)

  for (let i = 0; i < dataLength; i++) {
    dataWriter.writeUint8(reader.readUint8())
  }

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
  const type = NetworkMessageType.WebSocketOutbound
  const connectionId = readConnectionId(reader)
  const binaryType = reader.readUint8()

  const dataLength = reader.readUint32()
  const data = new ArrayBuffer(dataLength)
  const dataWriter = new BufferWriter(data, 0, LITTLE_ENDIAN)

  for (let i = 0; i < dataLength; i++) {
    dataWriter.writeUint8(reader.readUint8())
  }

  return {
    type,
    connectionId,
    binaryType,
    data,
  }
}
