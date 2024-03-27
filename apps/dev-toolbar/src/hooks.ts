import { useAtomState } from '@repro/atom'
import { useContext } from 'react'
import { StateContext } from './context'

export function useAppState() {
  return useContext(StateContext)
}

export function useSelectedEvent() {
  const state = useAppState()
  return useAtomState(state.$selectedEvent)
}

export function useVisiblePane() {
  const state = useAppState()
  return useAtomState(state.$visiblePane)
}
