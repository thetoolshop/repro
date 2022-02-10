import { useContext } from 'react'
import { useAtomValue } from '@/utils/state'
import { PlaybackContext } from './context'
import { EMPTY_PLAYBACK } from './createSourcePlayback'
import { PointerState } from '@/types/interaction'
import { OUT_OF_BOUNDS_POINT, ZERO_POINT } from './constants'

export function usePlayback() {
  return useContext(PlaybackContext) || EMPTY_PLAYBACK
}

export function useActiveIndex() {
  const playback = usePlayback()
  return useAtomValue(playback.$activeIndex)
}

export function useBuffer() {
  const playback = usePlayback()
  return useAtomValue(playback.$buffer)
}

export function useLatestControlFrame() {
  const playback = usePlayback()
  return useAtomValue(playback.$latestControlFrame)
}

export function useElapsed() {
  const playback = usePlayback()
  return useAtomValue(playback.$elapsed)
}

export function useSnapshot() {
  const playback = usePlayback()
  return useAtomValue(playback.$snapshot)
}

export function usePlaybackState() {
  const playback = usePlayback()
  return useAtomValue(playback.$playbackState)
}

export function usePointer() {
  const snapshot = useSnapshot()
  return snapshot.interaction?.pointer || OUT_OF_BOUNDS_POINT
}

export function usePointerState() {
  const snapshot = useSnapshot()
  return snapshot.interaction?.pointerState || PointerState.Up
}

export function useViewport() {
  const snapshot = useSnapshot()
  return snapshot.interaction?.viewport || ZERO_POINT
}
