import { IndexedRecord, SyntheticId } from '@/types/common'
import {
  InteractionSnapshot,
  PointerState,
  ScrollMap,
} from '@/types/interaction'
import {
  FetchRequestSnapshot,
  FetchResponse,
  NetworkMessageType,
  NetworkSnapshot,
  WebSocketInbound,
  WebSocketOutbound,
  WebSocketSnapshot,
  WebSocketStatus,
} from '@/types/network'
import { Snapshot } from '@/types/recording'
import { BufferReader, BufferWriter } from 'arraybuffer-utils'
import {
  concat,
  ENUM_BYTE_LENGTH,
  UINT_32,
  LITTLE_ENDIAN,
  getByteLength,
  writeString32,
  readString32,
} from './common'
import {
  CORRELATION_ID_BYTE_LENGTH,
  decodeFetchRequest,
  encodeFetchRequest,
  decodeFetchResponse,
  encodeFetchResponse,
  readConnectionId,
  writeConnectionId,
  readCorrelationId,
  writeCorrelationId,
  CONNECTION_ID_BYTE_LENGTH,
  encodeWebSocketInbound,
  encodeWebSocketOutbound,
  readNetworkEventType,
  decodeWebSocketInbound,
  decodeWebSocketOutbound,
} from './network'
import { POINT_BYTE_LENGTH, readPoint, writePoint } from './point'
import {
  decodeVTree,
  encodeVTree,
  NODE_ID_BYTE_LENGTH,
  readNodeId,
  writeNodeId,
} from './vdom'

function encodeInteractionSnapshot(snapshot: InteractionSnapshot): ArrayBuffer {
  const scrollMapEntries = Object.entries(snapshot.scroll)

  const byteLength =
    POINT_BYTE_LENGTH +
    ENUM_BYTE_LENGTH +
    UINT_32 +
    scrollMapEntries
      .flatMap(() => [NODE_ID_BYTE_LENGTH, POINT_BYTE_LENGTH])
      .reduce((a, b) => a + b, 0) +
    POINT_BYTE_LENGTH

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writePoint(writer, snapshot.pointer)
  writer.writeUint8(snapshot.pointerState)
  writer.writeUint32(scrollMapEntries.length)

  for (const [nodeId, scrollOffset] of scrollMapEntries) {
    writeNodeId(writer, nodeId)
    writePoint(writer, scrollOffset)
  }

  writePoint(writer, snapshot.viewport)

  return buffer
}

function decodeInteractionSnapshot(reader: BufferReader): InteractionSnapshot {
  const pointer = readPoint(reader)
  const pointerState: PointerState = reader.readUint8()
  const scrollMapEntriesLength = reader.readUint32()
  const scroll: ScrollMap = {}

  for (let i = 0; i < scrollMapEntriesLength; i++) {
    const nodeId = readNodeId(reader)
    const scrollOffset = readPoint(reader)
    scroll[nodeId] = scrollOffset
  }

  const viewport = readPoint(reader)

  return {
    pointer,
    pointerState,
    scroll,
    viewport,
  }
}

export function encodeNetworkSnapshot(
  networkSnapshot: NetworkSnapshot
): ArrayBuffer {
  const { fetchRequests, websockets } = networkSnapshot
  const buffers: Array<ArrayBuffer> = []

  buffers.push(new Uint32Array([fetchRequests.index.length]).buffer)

  for (const correlationId of fetchRequests.index) {
    const snapshot = fetchRequests.data[correlationId]

    if (!snapshot) {
      throw new Error(
        `NetworkSnapshot codec: could not find fetch request with correlationId = ${correlationId}`
      )
    }

    const requestBuffer = encodeFetchRequest(snapshot.request)
    const responseBuffer = snapshot.response
      ? encodeFetchResponse(snapshot.response)
      : new ArrayBuffer(0)

    const correlationIdBuffer = new ArrayBuffer(CORRELATION_ID_BYTE_LENGTH)
    writeCorrelationId(
      new BufferWriter(correlationIdBuffer, 0, LITTLE_ENDIAN),
      snapshot.correlationId
    )

    const timingBuffer = new ArrayBuffer(UINT_32 + UINT_32)
    const timingBufferWriter = new BufferWriter(timingBuffer, 0, LITTLE_ENDIAN)
    timingBufferWriter.writeUint32(snapshot.startAt)
    timingBufferWriter.writeUint32(snapshot.endAt ?? 0)

    const buffer = concat([
      correlationIdBuffer,
      requestBuffer,

      new Uint8Array([snapshot.response ? 1 : 0]).buffer,
      responseBuffer,

      timingBuffer,
    ])

    buffers.push(buffer)
  }

  buffers.push(new Uint32Array([websockets.index.length]).buffer)

  for (const connectionId of websockets.index) {
    const snapshot = websockets.data[connectionId]

    if (!snapshot) {
      throw new Error(
        `NetworkSnapshot codec: could not find websocket with connectionId = ${connectionId}`
      )
    }

    const connectionIdBuffer = new ArrayBuffer(CONNECTION_ID_BYTE_LENGTH)
    writeConnectionId(
      new BufferWriter(connectionIdBuffer, 0, LITTLE_ENDIAN),
      snapshot.connectionId
    )

    const urlBuffer = new ArrayBuffer(UINT_32 + getByteLength(snapshot.url))
    writeString32(new BufferWriter(urlBuffer, 0, LITTLE_ENDIAN), snapshot.url)

    const timingBuffer = new ArrayBuffer(UINT_32 + UINT_32)
    const timingBufferWriter = new BufferWriter(timingBuffer, 0, LITTLE_ENDIAN)
    timingBufferWriter.writeUint32(snapshot.startAt)
    timingBufferWriter.writeUint32(snapshot.endAt ?? 0)

    const buffer = concat([
      connectionIdBuffer,
      urlBuffer,
      new Uint8Array([snapshot.status]).buffer,

      new Uint32Array([snapshot.messages.length]).buffer,
      concat(
        snapshot.messages.map(message =>
          message.type === NetworkMessageType.WebSocketInbound
            ? encodeWebSocketInbound(message)
            : encodeWebSocketOutbound(message)
        )
      ),

      timingBuffer,
    ])

    buffers.push(buffer)
  }

  return concat(buffers)
}

export function decodeNetworkSnapshot(reader: BufferReader): NetworkSnapshot {
  const fetchRequestsLength = reader.readUint32()

  const fetchRequests: IndexedRecord<SyntheticId, FetchRequestSnapshot> = {
    data: {},
    index: [],
  }

  for (let i = 0; i < fetchRequestsLength; i++) {
    const correlationId = readCorrelationId(reader)

    // The FetchRequest decoder expects the event type to have already been read
    readNetworkEventType(reader)
    const request = decodeFetchRequest(reader)
    const hasResponse = reader.readUint8() === 1
    let response: FetchResponse | null = null

    if (hasResponse) {
      // The FetchResponse decoder expects the event type to have already been read
      readNetworkEventType(reader)
      response = decodeFetchResponse(reader)
    }

    const startAt = reader.readUint32()
    const endAt = reader.readUint32() || null

    const snapshot: FetchRequestSnapshot = {
      correlationId,
      request,
      response,
      startAt,
      endAt,
    }

    fetchRequests.data[correlationId] = snapshot
    fetchRequests.index.push(correlationId)
  }

  const websocketsLength = reader.readUint32()

  const websockets: IndexedRecord<SyntheticId, WebSocketSnapshot> = {
    data: {},
    index: [],
  }

  for (let i = 0; i < websocketsLength; i++) {
    const connectionId = readConnectionId(reader)
    const url = readString32(reader)
    const status: WebSocketStatus = reader.readUint8()
    const messagesLength = reader.readUint32()
    const messages: Array<WebSocketInbound | WebSocketOutbound> = []

    for (let j = 0; j < messagesLength; j++) {
      const messageType:
        | NetworkMessageType.WebSocketInbound
        | NetworkMessageType.WebSocketOutbound = reader.readUint8()

      messages.push(
        messageType === NetworkMessageType.WebSocketInbound
          ? decodeWebSocketInbound(reader)
          : decodeWebSocketOutbound(reader)
      )
    }

    const startAt = reader.readUint32()
    const endAt = reader.readUint32() || null

    const snapshot: WebSocketSnapshot = {
      connectionId,
      url,
      status,
      messages,
      startAt,
      endAt,
    }

    websockets.data[connectionId] = snapshot
    websockets.index.push(connectionId)
  }

  return {
    fetchRequests,
    websockets,
  }
}

export function encodeSnapshot(snapshot: Snapshot): ArrayBuffer {
  const domHeader = new Uint8Array([snapshot.dom ? 1 : 0]).buffer
  const domBuffer = snapshot.dom
    ? encodeVTree(snapshot.dom)
    : new ArrayBuffer(0)

  const interactionHeader = new Uint8Array([snapshot.interaction ? 1 : 0])
    .buffer
  const interactionBuffer = snapshot.interaction
    ? encodeInteractionSnapshot(snapshot.interaction)
    : new ArrayBuffer(0)

  const networkHeader = new Uint8Array([snapshot.network ? 1 : 0]).buffer
  const networkBuffer = snapshot.network
    ? encodeNetworkSnapshot(snapshot.network)
    : new ArrayBuffer(0)

  return concat([
    domHeader,
    domBuffer,
    interactionHeader,
    interactionBuffer,
    networkHeader,
    networkBuffer,
  ])
}

export function decodeSnapshot(reader: BufferReader): Snapshot {
  const snapshot: Snapshot = {
    dom: null,
  }

  const domHeader = reader.readUint8()

  if (domHeader === 1) {
    snapshot.dom = decodeVTree(reader)
  }

  const interactionHeader = reader.readUint8()

  if (interactionHeader === 1) {
    snapshot.interaction = decodeInteractionSnapshot(reader)
  }

  const networkHeader = reader.readUint8()

  if (networkHeader === 1) {
    snapshot.network = decodeNetworkSnapshot(reader)
  }

  return snapshot
}
