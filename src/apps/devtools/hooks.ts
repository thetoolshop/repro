import { useRecordingStream } from '@/libs/record'
import { useAtomValue } from '@/utils/state'
import { useContext } from 'react'
import { StateContext } from './context'

export function useDevtoolsState() {
  return useContext(StateContext)
}

export function useActive() {
  const state = useDevtoolsState()
  return useAtomValue(state.$active)
}

export function usePicker() {
  const state = useDevtoolsState()
  return useAtomValue(state.$picker)
}

export function useTargetNode() {
  const state = useDevtoolsState()
  const stream = useRecordingStream()
  const targetNodeId = useAtomValue(state.$targetNodeId)
  return targetNodeId ? stream.peek(targetNodeId) : null
}
