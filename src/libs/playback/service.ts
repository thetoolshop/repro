import { SourceEvent, SourceEventType } from '@/types/source'
import { copy } from '@/utils/lang'
import { createSetter } from '@/utils/state'
import {applyVTreePatch} from '@/utils/vdom'

import {
  $buffer,
  $cursor,
  $duration,
  $elapsed,
  $events,
  $playbackState,
  $snapshot,
  $source,
} from './state'

export const getBuffer = () => $buffer.getValue()
export const setBuffer = createSetter($buffer)
export const setCursor = createSetter($cursor)
export const setSource = createSetter($source)
export const setDuration = createSetter($duration)
export const setElapsed = createSetter($elapsed)
export const setEvents = createSetter($events)
export const setPlaybackState = createSetter($playbackState)
export const setSnapshot = createSetter($snapshot)

export const seek = (time: number) => {
  let cursor = -1
  let events = copy($events.getValue())
  let event: SourceEvent | undefined

  while (event = events[0]) {
    if (event.time > time) {
      break
    }

    switch (event.type) {
      case SourceEventType.DOMSnapshot:
        setSnapshot(event.data)
        break

      case SourceEventType.DOMPatch:
        const patch = event.data
        setSnapshot(snapshot => {
          return snapshot
            ? applyVTreePatch(snapshot, patch)
            : null
        })
        break
    }

    events.shift()
    cursor++
  }

  $buffer.next(events)
  $cursor.next(cursor)
  setElapsed(time)
}
