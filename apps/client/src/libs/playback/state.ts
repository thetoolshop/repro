import { SyntheticId } from '@repro/domain'
import { createAtom } from '~/utils/state'

export enum ReadyState {
  Loading,
  Ready,
}

// TODO: move these on to context
export const [$focusedNode, setFocusedNode, getFocusedNode] =
  createAtom<SyntheticId | null>(null)
export const [$readyState, setReadyState, getReadyState] = createAtom(
  ReadyState.Loading
)
