import {
  InteractionSnapshot,
  PointerState,
  ScrollMap,
} from '@/types/interaction'
import { Snapshot } from '@/types/recording'
import { BufferReader, BufferWriter } from 'arraybuffer-utils'
import { concat, ENUM_BYTE_LENGTH, UINT_32, LITTLE_ENDIAN } from './common'
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

  return concat([domHeader, domBuffer, interactionHeader, interactionBuffer])
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

  return snapshot
}
