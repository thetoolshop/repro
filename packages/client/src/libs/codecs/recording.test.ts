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
import { ArrayBufferBackedList } from '@/utils/lang'
import { decodeEvent, encodeEvent } from './event'
import { BufferReader } from 'arraybuffer-utils'
import { LITTLE_ENDIAN } from './common'
import { decodeRecording, encodeRecording } from './recording'

const eventWriter = (event: SourceEvent) => encodeEvent(event)
const eventReader = (buffer: ArrayBuffer) => {
  const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
  return decodeEvent(reader)
}

describe('Recording codec', () => {
  it('should encode and decode a recording', () => {
    const input: Recording = {
      codecVersion: 1,
      id: nanoid(21),
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
    }

    const buffer = encodeRecording(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeRecording(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })
})
