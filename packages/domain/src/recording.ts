import {
  createView,
  StructDescriptor,
  UINT32,
  UINT8,
} from '@repro/typed-binary-encoder'

import { SyntheticId } from './common'

export interface Sample<T> {
  from: T
  to: T
  duration: number
}

export enum RecordingMode {
  None = 0,
  Snapshot = 1,
  Live = 2,
  Replay = 3,
}

export interface Recording {
  codecVersion: number
  id: SyntheticId
  mode: RecordingMode
  duration: number
  events: Array<ArrayBuffer>
}

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
