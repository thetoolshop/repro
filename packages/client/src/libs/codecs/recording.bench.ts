import { nanoid } from 'nanoid'
import { Recording } from '@/types/recording'
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
import { RecordingView } from './recording'
import { zlibSync } from 'fflate'
import { SourceEventView } from './event'

const recording: Recording = {
  codecVersion: 1,
  id: nanoid(21),
  duration: 60000,
  events: [
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
  ].map(event => SourceEventView.encode(event).buffer),
}

const encoded = RecordingView.encode(recording)

console.table({
  Recording: {
    raw: approxByteLength(recording),
    binary: approxByteLength(RecordingView.encode(recording)),
    perf_encode: stress(() => RecordingView.encode(recording)),
    perf_decode: stress(() => RecordingView.decode(encoded)),
    compressed: approxByteLength(
      zlibSync(new Uint8Array(RecordingView.encode(recording).buffer))
    ),
    perf_encode_compress: stress(() =>
      zlibSync(new Uint8Array(RecordingView.encode(recording).buffer))
    ),
  },
})
