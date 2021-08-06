import { useEffect } from 'react'
import { animationFrames, Subscription } from 'rxjs'
import { map, pairwise } from 'rxjs/operators'
import { copy } from '@/utils/lang'
import { SourceEvent, SourceEventType } from '@/types/source'
import { useAtomValue } from '@/utils/state'
import { applyVTreePatch } from '@/utils/vdom'
import { getBuffer, seek, setBuffer, setCursor, setElapsed, setEvents, setPlaybackState, setSnapshot } from './service'
import { PlaybackState, $duration, $elapsed, $playbackState, $snapshot, $source, $cursor } from './state'

export const useDuration = () => {
  return useAtomValue($duration)
}

export const useElapsed = () => {
  return useAtomValue($elapsed)
}

export const usePlaybackState = () => {
  return useAtomValue($playbackState)
}

export const useSnapshot = () => {
  return useAtomValue($snapshot)
}

export const useSource = () => {
  return useAtomValue($source)
}

export const usePlaybackLoop = () => {
  const cursor = useAtomValue($cursor)
  const elapsed = useElapsed()
  const duration = useDuration()
  const playbackState = usePlaybackState()
  const source = useSource()

  useEffect(() => {
    setPlaybackState(PlaybackState.Loading)
    source.events().then(events => {
      setEvents(events)
      seek(0)
      setPlaybackState(PlaybackState.Paused)
    })
  }, [source])

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
    if (playbackState !== PlaybackState.Loading) {
      if (duration > 0 && elapsed >= duration) {
        setPlaybackState(PlaybackState.Done)
      }
    }
  }, [duration, elapsed, playbackState, setPlaybackState])

  useEffect(() => {
    const buffer = copy(getBuffer())
    let event: SourceEvent | undefined
    let nextCursor = cursor

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
      nextCursor++
    }

    setBuffer(buffer)
    setCursor(nextCursor)
  }, [cursor, elapsed, setSnapshot])
}
