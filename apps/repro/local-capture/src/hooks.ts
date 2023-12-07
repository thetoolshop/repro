import { useAtomState } from '@repro/atom'
import { useContext } from 'react'
import { StateContext } from './context'

export function useAppState() {
  return useContext(StateContext)
}

export function useReadyState() {
  const state = useAppState()
  return useAtomState(state.$readyState)
}

export function useRecordingMode() {
  const state = useAppState()
  return useAtomState(state.$recordingMode)
}
