import { Recording } from '@/types/recording'
import { createView, StructDescriptor, UINT32 } from '@/utils/encoding'

// type Recording: struct {
//   codecVersion: uint32
//   id: char[21]
//   duration: uint32
//   events: list<SourceEvent>
// }

export const RecordingView = createView<Recording, StructDescriptor>({
  type: 'struct',
  fields: [
    ['codecVersion', UINT32],
    ['id', { type: 'char', bytes: 21 }],
    ['duration', UINT32],
    ['events', { type: 'vector', items: { type: 'buffer' } }],
  ],
})
