import { nanoid } from 'nanoid'
import { Recording, SourceEvent } from '@/types/recording'
import {
  snapshotEvent,
  pointerMoveEvent,
  viewportResizeEvent,
  textPatchEvent,
  attributePatchEvent,
  addNodesPatchEvent,
} from './fixtures/events'
import { approxByteLength } from '@/libs/record/buffer-utils'
import { stress } from '@/utils/bench'
import { ArrayBufferBackedList } from '@/utils/lang'
import { decodeEvent, encodeEvent } from './event'
import { BufferReader } from 'arraybuffer-utils'
import { LITTLE_ENDIAN } from './common'
import { encodeRecording } from './recording'
import { zlibSync } from 'fflate'

const eventWriter = (event: SourceEvent) => encodeEvent(event)
const eventReader = (buffer: ArrayBuffer) => {
  const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
  return decodeEvent(reader)
}

const recording: Recording = {
  id: nanoid(),
  duration: 60000,
  events: new ArrayBufferBackedList<SourceEvent>(
    [
      snapshotEvent,
      pointerMoveEvent,
      pointerMoveEvent,
      viewportResizeEvent,
      pointerMoveEvent,
      textPatchEvent,
      attributePatchEvent,
      snapshotEvent,
      addNodesPatchEvent,
      snapshotEvent,
    ].map(encodeEvent),
    eventReader,
    eventWriter
  ),
  snapshotIndex: [0, 7, 9],
}

console.table({
  Recording: {
    raw: approxByteLength(recording),
    binary: approxByteLength(encodeRecording(recording)),
    perf_encode: stress(() => encodeRecording(recording)),
    compressed: approxByteLength(
      zlibSync(new Uint8Array(encodeRecording(recording)))
    ),
    perf_encode_compress: stress(() =>
      zlibSync(new Uint8Array(encodeRecording(recording)))
    ),
  },
})
