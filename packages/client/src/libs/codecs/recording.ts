import { Recording } from '@/types/recording'
import { createView, StructDescriptor, UINT32, UINT8 } from '@/utils/encoding'

// type RecordingMode: enum<uint8> {
//   0: None
//   1: Snapshot
//   2: Live
//   3: Replay
// }
//
// type Recording: struct {
//   codecVersion: uint32
//   id: char[21]
//   mode: RecordingMode
//   duration: uint32
//   events: list<SourceEvent>
// }

export const RecordingView = createView<Recording, StructDescriptor>({
  type: 'struct',
  fields: [
    ['codecVersion', UINT32],
    ['id', { type: 'char', bytes: 21 }],
    ['mode', UINT8],
    ['duration', UINT32],
    ['events', { type: 'vector', items: { type: 'buffer' } }],
  ],
})
