import { createAtom } from '@/utils/state'

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
