import { useEffect } from 'react'
import { animationFrames, Subscription } from 'rxjs'
import { map, pairwise } from 'rxjs/operators'
import { copy } from '@/utils/lang'
import { SourceEvent, SourceEventType } from '@/types/source'
import { createValueHook, useAtomValue } from '@/utils/state'
import { applyVTreePatch } from '@/utils/vdom'
import { getBuffer, setBuffer, setCursor, setElapsed, setPlaybackState, setSnapshot } from './service'
import { PlaybackState, $duration, $elapsed, $playbackState, $snapshot, $source, $cursor, $readyState, $focusedNode, $events } from './state'

export const useCursor = createValueHook($cursor)
export const useDuration = createValueHook($duration)
export const useElapsed = createValueHook($elapsed)
export const useEvents = createValueHook($events)
export const usePlaybackState = createValueHook($playbackState)
export const useReadyState = createValueHook($readyState)
export const useSnapshot = createValueHook($snapshot)
export const useSource = createValueHook($source)
export const useFocusedNode = createValueHook($focusedNode)

export const usePlaybackLoop = () => {
  const cursor = useAtomValue($cursor)
  const elapsed = useElapsed()
  const duration = useDuration()
  const playbackState = usePlaybackState()

  useEffect(() => {
    const subscription = new Subscription()

    if (playbackState === PlaybackState.Playing) {
      subscription.add(
        animationFrames().pipe(
          pairwise(),
          map(([prev, next]) => next.timestamp - prev.timestamp)
        ).subscribe(delta => {
          setElapsed(elapsed => Math.min(duration, elapsed + delta))
        })
      )
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [playbackState, duration])

  useEffect(() => {
    if (duration > 0 && elapsed >= duration) {
      setPlaybackState(PlaybackState.Done)
    }
  }, [duration, elapsed, setPlaybackState])

  useEffect(() => {
    if (playbackState === PlaybackState.Playing) {
      const buffer = copy(getBuffer())
      let event: SourceEvent | undefined
      let i = 0

      while (event = buffer[0]) {
        if (event.time > elapsed) {
          break
        }

        if (event.type === SourceEventType.DOMSnapshot) {
          setSnapshot(event.data)
        } else if (event.type === SourceEventType.DOMPatch) {
          const patch = event.data
          setSnapshot(snapshot => {
            // TODO throw if snapshot missing
            return snapshot
              ? applyVTreePatch(snapshot, patch)
              : snapshot
          })
        }

        buffer.shift() 
        i++
      }

      setBuffer(buffer)
      setCursor(cursor => cursor + i)
    }
  }, [elapsed, playbackState, setSnapshot])
}
