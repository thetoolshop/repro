import { useAtomState } from '@repro/atom'
import { useContext } from 'react'
import { StateContext } from './context'

export function useAppState() {
  return useContext(StateContext)
}

export function useActive() {
  const state = useAppState()
  return useAtomState(state.$active)
}

export function useCurrentUser() {
  const state = useAppState()
  return useAtomState(state.$currentUser)
}

export function useRecordingMode() {
  const state = useAppState()
  return useAtomState(state.$recordingMode)
}

export function useReadyState() {
  const state = useAppState()
  return useAtomState(state.$readyState)
}
