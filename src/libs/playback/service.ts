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
  $focusedNode,
  $playbackState,
  $readyState,
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
export const setFocusedNode = createSetter($focusedNode)
export const setPlaybackState = createSetter($playbackState)
export const setReadyState = createSetter($readyState)
export const setSnapshot = createSetter($snapshot)

export const seekToTime = (time: number) => {
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

export const seekToEvent = (nextCursor: number) => {
  let events = copy($events.getValue())
  let event: SourceEvent | undefined
  let elapsed = 0
  let i = 0

  while (event = events.shift()) {
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

    elapsed = event.time

    if (i === nextCursor) {
      break
    }

    i++
  }

  $buffer.next(events)
  $cursor.next(nextCursor)
  setElapsed(elapsed)
}

export const init = (events: Array<SourceEvent>, duration: number) => {
  setEvents(events)
  setDuration(duration)
  seekToTime(0)
}
