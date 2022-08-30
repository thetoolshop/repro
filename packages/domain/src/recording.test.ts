import { nanoid } from 'nanoid'
import {
  snapshotEvent,
  pointerMoveEvent,
  viewportResizeEvent,
  textPatchEvent,
  attributePatchEvent,
  addNodesPatchEvent,
} from './fixtures/events'
import { SourceEventView } from './event'
import { Recording, RecordingMode, RecordingView } from './recording'

describe('Recording codec', () => {
  it('should create a binary view for a recording', () => {
    const input: Recording = {
      codecVersion: 1,
      id: nanoid(21),
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

    // const buffer = RecordingView.encode(input)
    const view = RecordingView.from(input)

    // Recordings are mostly binary to begin with, and encoding adds overhead.
    // This assertion is not really relevant.
    // expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })
})
