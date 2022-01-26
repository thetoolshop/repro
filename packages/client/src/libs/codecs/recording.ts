import { SyntheticId } from '@/types/common'
import { Recording, SourceEvent } from '@/types/recording'
import { ArrayBufferBackedList } from '@/utils/lang'
import { BufferReader, BufferWriter } from 'arraybuffer-utils'
import { concat, LITTLE_ENDIAN, UINT_32 } from './common'
import { decodeEvent, encodeEvent } from './event'

const RECORDING_ID_BYTE_LENGTH = 21

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function writeRecordingId(writer: BufferWriter, recordingId: SyntheticId) {
  const bytes = textEncoder.encode(recordingId)

  if (bytes.byteLength !== RECORDING_ID_BYTE_LENGTH) {
    throw new Error(
      `Recording codec: invalid recording ID (${recordingId}: ${bytes.byteLength} bytes)`
    )
  }

  for (const byte of bytes) {
    writer.writeUint8(byte)
  }
}

function readRecordingId(reader: BufferReader): SyntheticId {
  const bytes: Array<number> = []

  for (let i = 0; i < RECORDING_ID_BYTE_LENGTH; i++) {
    bytes.push(reader.readUint8())
  }

  return textDecoder.decode(new Uint8Array(bytes))
}

export function encodeRecording(recording: Recording): ArrayBuffer {
  const headerByteLength = RECORDING_ID_BYTE_LENGTH + UINT_32 + UINT_32

  const headerBuffer = new ArrayBuffer(headerByteLength)
  const headerWriter = new BufferWriter(headerBuffer, 0, LITTLE_ENDIAN)

  writeRecordingId(headerWriter, recording.id)
  headerWriter.writeUint32(recording.duration)
  headerWriter.writeUint32(recording.events.size())

  const eventBuffers: Array<ArrayBuffer> = []

  for (let i = 0, len = recording.events.size(); i < len; i++) {
    const buffer = recording.events.at(i)

    if (buffer) {
      eventBuffers.push(new Uint32Array([buffer.byteLength]).buffer, buffer)
    }
  }

  return concat([headerBuffer, ...eventBuffers])
}

function eventReader(buffer: ArrayBuffer): SourceEvent {
  const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
  return decodeEvent(reader)
}

function eventWriter(event: SourceEvent): ArrayBuffer {
  return encodeEvent(event)
}

export function decodeRecording(reader: BufferReader): Recording {
  const id = readRecordingId(reader)
  const duration = reader.readUint32()
  const eventCount = reader.readUint32()
  const events: Array<ArrayBuffer> = []

  for (let i = 0; i < eventCount; i++) {
    const byteLength = reader.readUint32()
    const bytes: Array<number> = []

    for (let j = 0; j < byteLength; j++) {
      bytes.push(reader.readUint8())
    }

    events.push(new Uint8Array(bytes).buffer)
  }

  return {
    id,
    duration,
    events: new ArrayBufferBackedList(events, eventReader, eventWriter),
  }
}
