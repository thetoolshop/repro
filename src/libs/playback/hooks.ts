import { useEffect } from 'react'
import { animationFrames, Subscription } from 'rxjs'
import { map, pairwise } from 'rxjs/operators'
import { copyArray } from '@/utils/lang'
import { SourceEvent } from '@/types/recording'
import { createValueHook } from '@/utils/state'
import { processEvents } from './service'
import { isSample } from './utils'

import {
  $activeIndex,
  $elapsed,
  $focusedNode,
  $playbackState,
  $pointer,
  $pointerState,
  $readyState,
  $recording,
  $scrollStates, 
  $snapshot,
  $source,
  $viewport,
  PlaybackState,
  getBuffer,
  setActiveIndex,
  setBuffer,
  setElapsed,
  setPlaybackState,
  setSnapshot,
} from './state'

export const useActiveIndex = createValueHook($activeIndex)
export const useElapsed = createValueHook($elapsed)
export const useFocusedNode = createValueHook($focusedNode)
export const usePlaybackState = createValueHook($playbackState)
export const usePointer = createValueHook($pointer)
export const usePointerState = createValueHook($pointerState)
export const useReadyState = createValueHook($readyState)
export const useRecording = createValueHook($recording)
export const useScrollStates = createValueHook($scrollStates)
export const useSnapshot = createValueHook($snapshot)
export const useSource = createValueHook($source)
export const useViewport = createValueHook($viewport)

export const usePlaybackLoop = () => {
  const elapsed = useElapsed()
  const recording = useRecording()
  const playbackState = usePlaybackState()

  useEffect(() => {
    const subscription = new Subscription()

    if (playbackState === PlaybackState.Playing) {
      subscription.add(
        animationFrames().pipe(
          pairwise(),
          map(([prev, next]) => next.timestamp - prev.timestamp)
        ).subscribe(delta => {
          setElapsed(elapsed => Math.min(recording.duration, elapsed + delta))
        })
      )
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [playbackState, recording.duration])

  useEffect(() => {
    if (recording.duration > 0 && elapsed >= recording.duration) {
      setPlaybackState(PlaybackState.Done)
    }
  }, [recording.duration, elapsed, setPlaybackState])

  useEffect(() => {
    if (playbackState === PlaybackState.Playing) {
      const buffer = copyArray(getBuffer())
      let event: SourceEvent | undefined
      let i = 0

      // Sample events should be tracked until resolved
      const unresolvedEvents: Array<SourceEvent> = []
      const queue: Array<SourceEvent> = []

      while (event = buffer[0]) {
        if (event.time > elapsed) {
          break
        }

        queue.push(event)

        if (isSample(event) && event.time + event.duration > elapsed) {
          unresolvedEvents.push(event)
        }

        buffer.shift()

        i++
      }

      processEvents(queue)

      setBuffer([...unresolvedEvents, ...buffer])
      setActiveIndex(activeIndex => activeIndex + i)
    }
  }, [elapsed, playbackState, setSnapshot])
}
