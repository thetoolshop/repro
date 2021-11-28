import { BufferReader, BufferWriter } from 'arraybuffer-utils'
import {
  CloseRecordingEvent,
  DOMPatchEvent,
  InteractionEvent,
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
} from '@/types/recording'
import { concat, ENUM_BYTE_LENGTH, HEADER_32, LITTLE_ENDIAN } from './common'
import { decodeInteraction, encodeInteraction } from './interaction'
import { decodeSnapshot, encodeSnapshot } from './snapshot'
import { decodePatch, encodePatch } from './vdom'

export function readEventType(buffer: ArrayBuffer): SourceEventType {
  const view = new DataView(buffer)
  return view.getUint8(0)
}

export function readEventTime(buffer: ArrayBuffer): number {
  const view = new DataView(buffer)
  return view.getUint32(1, LITTLE_ENDIAN)
}

export function encodeEvent(event: SourceEvent): ArrayBuffer {
  switch (event.type) {
    case SourceEventType.Snapshot:
      return encodeSnapshotEvent(event)

    case SourceEventType.DOMPatch:
      return encodeDOMPatchEvent(event)

    case SourceEventType.Interaction:
      return encodeInteractionEvent(event)

    case SourceEventType.CloseRecording:
      return encodeCloseRecordingEvent(event)
  }
}

export function decodeEvent(reader: BufferReader): SourceEvent {
  const type: SourceEventType = reader.readUint8()

  switch (type) {
    case SourceEventType.Snapshot:
      return decodeSnapshotEvent(reader)

    case SourceEventType.DOMPatch:
      return decodeDOMPatchEvent(reader)

    case SourceEventType.Interaction:
      return decodeInteractionEvent(reader)

    case SourceEventType.CloseRecording:
      return decodeCloseRecordingEvent(reader)
  }
}

export function encodeSnapshotEvent(event: SnapshotEvent): ArrayBuffer {
  const byteLength = ENUM_BYTE_LENGTH + HEADER_32
  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(event.type)
  writer.writeUint32(event.time)

  return concat([buffer, encodeSnapshot(event.data)])
}

export function decodeSnapshotEvent(reader: BufferReader): SnapshotEvent {
  const type = SourceEventType.Snapshot
  const time = reader.readUint32()
  const data = decodeSnapshot(reader)
  return { type, time, data }
}

export function encodeDOMPatchEvent(event: DOMPatchEvent): ArrayBuffer {
  const byteLength = ENUM_BYTE_LENGTH + HEADER_32
  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(event.type)
  writer.writeUint32(event.time)

  return concat([buffer, encodePatch(event.data)])
}

export function decodeDOMPatchEvent(reader: BufferReader): DOMPatchEvent {
  const type = SourceEventType.DOMPatch
  const time = reader.readUint32()
  const data = decodePatch(reader)
  return { type, time, data }
}

export function encodeInteractionEvent(event: InteractionEvent): ArrayBuffer {
  const byteLength = ENUM_BYTE_LENGTH + HEADER_32
  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(event.type)
  writer.writeUint32(event.time)

  return concat([buffer, encodeInteraction(event.data)])
}

export function decodeInteractionEvent(reader: BufferReader): InteractionEvent {
  const type = SourceEventType.Interaction
  const time = reader.readUint32()
  const data = decodeInteraction(reader)
  return { type, time, data }
}

export function encodeCloseRecordingEvent(
  event: CloseRecordingEvent
): ArrayBuffer {
  const byteLength = ENUM_BYTE_LENGTH + HEADER_32
  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(event.type)
  writer.writeUint32(event.time)

  return buffer
}

export function decodeCloseRecordingEvent(
  reader: BufferReader
): CloseRecordingEvent {
  const type = SourceEventType.CloseRecording
  const time = reader.readUint32()
  return { type, time }
}
