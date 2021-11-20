import { useContext } from 'react'
import { createValueHook, useAtomValue } from '@/utils/state'
import { ReplayContext } from './context'
import { $focusedNode, $readyState, $recording, $source } from './state'

export const useFocusedNode = createValueHook($focusedNode)
export const useReadyState = createValueHook($readyState)
export const useRecording = createValueHook($recording)
export const useSource = createValueHook($source)

export function useReplay() {
  return useContext(ReplayContext)
}

export function useActiveIndex() {
  const replay = useReplay()
  return useAtomValue(replay.$activeIndex)
}

export function useBuffer() {
  const replay = useReplay()
  return useAtomValue(replay.$buffer)
}

export function useElapsed() {
  const replay = useReplay()
  return useAtomValue(replay.$elapsed)
}

export function usePlaybackState() {
  const replay = useReplay()
  return useAtomValue(replay.$playbackState)
}

export function usePointer() {
  const replay = useReplay()
  return useAtomValue(replay.$pointer)
}

export function usePointerState() {
  const replay = useReplay()
  return useAtomValue(replay.$pointerState)
}

export function useSnapshot() {
  const replay = useReplay()
  return useAtomValue(replay.$snapshot)
}

export function useViewport() {
  const replay = useReplay()
  return useAtomValue(replay.$viewport)
}
