import { approxByteLength } from '@repro/typed-binary-encoder'
import { zlibSync } from 'fflate'
import { v4 as uuidv4 } from 'uuid'
import {
  snapshotEvent,
  pointerMoveEvent,
  viewportResizeEvent,
  textPatchEvent,
  attributePatchEvent,
  addNodesPatchEvent,
} from './fixtures/events'
import { stress } from './bench-utils'
import { Recording, RecordingMode, RecordingView } from './recording'
import { SourceEventView } from './event'

const recording: Recording = {
  codecVersion: 1,
  id: uuidv4(),
  mode: RecordingMode.Replay,
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
    perf_validate_encode: stress(() =>
      RecordingView.encode(recording, { validate: true })
    ),
    perf_decode: stress(() => RecordingView.decode(encoded)),
    compressed: approxByteLength(
      zlibSync(new Uint8Array(RecordingView.encode(recording).buffer))
    ),
    perf_encode_compress: stress(() =>
      zlibSync(new Uint8Array(RecordingView.encode(recording).buffer))
    ),
  },
})
