import { RecordingController } from '@/libs/record'
import { SyntheticId } from '@/types/common'
import { Recording, Source } from '@/types/recording'
import { createAtom } from '@/utils/state'
import { NullSource } from './NullSource'

export enum ReadyState {
  Loading,
  Ready,
}

// TODO: move these on to context
export const [$focusedNode, getFocusedNode, setFocusedNode] =
  createAtom<SyntheticId | null>(null)
export const [$readyState, getReadyState, setReadyState] = createAtom(
  ReadyState.Loading
)
export const [$recording, getRecording, setRecording] = createAtom<Recording>(
  RecordingController.EMPTY
)
export const [$source, getSource, setSource] = createAtom<Source>(
  new NullSource()
)
