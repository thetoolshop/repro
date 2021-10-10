import { append, uniq, without } from 'ramda'
import { SyntheticId } from '@/types/common'
import { atom, useAtomValue } from '@/utils/state'
import {setFocusedNode} from '@/libs/playback'

export const $openNodes = atom<Array<SyntheticId>>([])
export const $selectedNode = atom<[SyntheticId, 'open' | 'close'] | null>(null)
export const $focusedNodeTag = atom<'open' | 'close' | null>(null)

export const toggleOpen = (nodeId: SyntheticId, open: boolean) => {
  $openNodes.next(
    open
      ? uniq(append(nodeId, $openNodes.getValue()))
      : without([nodeId], $openNodes.getValue())
  )
}

export const selectNode = (nodeId: SyntheticId, tag: 'open' | 'close') => {
  $selectedNode.next([nodeId, tag])
}

export const focusNode = (nodeId: SyntheticId, tag: 'open' | 'close') => {
  $focusedNodeTag.next(tag)
  setFocusedNode(nodeId)
}

export const blurNode = () => {
  setFocusedNode(null)
  $focusedNodeTag.next(null)
}

export const useFocusedNodeTag = () => {
  return useAtomValue($focusedNodeTag)
}
