import { InteractionType, Point, Sample } from '@/types/interaction'
import { DOMPatchEvent, InteractionEvent, Recording, SnapshotEvent, SourceEvent, SourceEventType } from '@/types/recording'
import { copyArray, copyObject, copyObjectDeep } from '@/utils/lang'
import { applyVTreePatch } from '@/utils/vdom'
import { Stats, Trace } from '@/libs/diagnostics'

import {
  $recording,
  PlaybackState,
  PointerState,
  getElapsed,
  getPointer,
  getPointerState,
  getSnapshot,
  getViewport,
  setActiveIndex,
  setBuffer,
  setElapsed,
  setPlaybackState,
  setPointer,
  setPointerState,
  setRecording,
  setSnapshot,
  setViewport,
  getScrollStates,
  setScrollStates,
} from './state'

export const seekToTime = (time: number) => {
  const recording = $recording.getValue()
  let activeIndex = -1
  let events = copyArray(recording.events)
  let event: SourceEvent | undefined

  for (const index of recording.snapshotIndex) {
    const snapshot = events[index] as SnapshotEvent | undefined

    if (snapshot && snapshot.time <= time) {
      events = events.slice(index)
      continue
    }

    break
  }

  let queue: Array<SourceEvent> = []

  while (event = events[0]) {
    if (event.time > time) {
      break
    }
    
    queue.push(event)
    events.shift()
    activeIndex++
  }

  // TODO: split queue into events by type and process sequentially
  processEvents(queue)

  setBuffer(events)
  setActiveIndex(activeIndex)
  setElapsed(time)
}

export const seekToEvent = (nextIndex: number) => {
  const recording = $recording.getValue()
  let events = copyArray(recording.events)
  let event: SourceEvent | undefined
  let elapsed = 0
  let i = 0

  for (const index of recording.snapshotIndex) {
    if (index <= nextIndex) {
      events = events.slice(index)
      continue
    }

    break
  }

  let queue: Array<SourceEvent> = []

  while (event = events[0]) {
    if (i === nextIndex) {
      break
    }

    queue.push(event)

    // TODO: do not drop sampled events until full sample window has passed
    events.shift()
    i++
  }

  processEvents(queue)

  setBuffer(events)
  setActiveIndex(nextIndex)
  setElapsed(elapsed)
}

export const init = (recording: Recording) => {
  setRecording(recording)
  setPointer([0, 0])
  setPointerState(PointerState.Up)
  setScrollStates({})
  setViewport([0, 0])
  setPlaybackState(PlaybackState.Paused)
  seekToTime(0)
}

function processDOMEvents(events: Array<SnapshotEvent | DOMPatchEvent>) {
  const start = performance.now()
  let queue: Array<SnapshotEvent | DOMPatchEvent> = []
  let snapshot = getSnapshot()
  let dirty = false

  for (const event of events) {
    if (event.type === SourceEventType.Snapshot) {
      queue = []
    }

    queue.push(event)
  }

  for (const event of events) {
    switch (event.type) {
      case SourceEventType.Snapshot:
        if (event.data.dom) {
          snapshot = copyObjectDeep(event.data.dom)
        }
        break

      case SourceEventType.DOMPatch:
        const patch = event.data

        if (snapshot) {
          dirty = true
          applyVTreePatch(snapshot, patch)
        }
        break
    }
  }

  if (dirty && snapshot) {
    snapshot = copyObject(snapshot)
  }

  setSnapshot(snapshot)
  Stats.sample('process DOM events: duration', performance.now() - start)
}

function processInteractionEvents(events: Array<SnapshotEvent | InteractionEvent>) {
  const start = performance.now()

  const elapsed = getElapsed()
  let viewport = getViewport()
  let pointer = getPointer()
  let pointerState = getPointerState()
  let scrollStates = getScrollStates()

  function interpolatePointFromSample(from: Point, to: Sample<Point>, time: number): Point {
    const fromValue = from
    const { duration, value: toValue } = to

    // If sample window has already expired or duration is 0, jump to end value
    if (time + duration < elapsed || duration === 0) {
      return copyArray(toValue) as Point
    } else {
      const offset = Math.max(0, duration - ((time + duration) - elapsed))
      const adjustment = offset / duration

      const offsetValue: Point = [
        fromValue[0] + ((toValue[0] - fromValue[0]) * adjustment),
        fromValue[1] + ((toValue[1] - fromValue[1]) * adjustment),
      ]

      return offsetValue
    }
  }

  for (const event of events) {
    if (event.type === SourceEventType.Snapshot) {
      if (event.data.interaction) {
        scrollStates = copyObjectDeep(event.data.interaction.scroll)
      }

      continue
    }

    switch (event.data.type) {
      case InteractionType.PointerMove:
        pointer = interpolatePointFromSample(
          event.data.from,
          event.data.to,
          event.time
        )
        break

      case InteractionType.PointerDown:
        pointer = event.data.at
        pointerState = PointerState.Down
        break

      case InteractionType.PointerUp:
        pointer = event.data.at
        pointerState = PointerState.Up
        break

      case InteractionType.ViewportResize:
        viewport = interpolatePointFromSample(
          event.data.from,
          event.data.to,
          event.time
        )
        break

      case InteractionType.Scroll:
        scrollStates = copyObject(scrollStates)
        scrollStates[event.data.target] = interpolatePointFromSample(
          event.data.from,
          event.data.to,
          event.time
        )
        break
    }
  }

  setViewport(viewport)
  setPointer(pointer)
  setPointerState(pointerState)
  setScrollStates(scrollStates)
  Stats.sample('process interaction events: duration', performance.now() - start)
}

export function processEvents(events: Array<SourceEvent>) {
  if (events.length === 0) {
    return
  }

  const start = performance.now() 

  Trace.createFrame(() => {
    const snapshot = getSnapshot()
    const elapsed = getElapsed()

    return {
      elapsed,
      snapshot,
      events,
    }
  })

  const domEvents: Array<SnapshotEvent | DOMPatchEvent> = []
  const interactionEvents: Array<SnapshotEvent | InteractionEvent> = []

  for (const event of events) {
    switch (event.type) {
      case SourceEventType.Snapshot:
        // TODO: should these be split into synthetic events for clarity?
        if ('dom' in event.data) {
          domEvents.push(event)
        }

        if ('interaction' in event.data) {
          interactionEvents.push(event)
        }
        break

      case SourceEventType.DOMPatch:
        domEvents.push(event)
        break

      case SourceEventType.Interaction:
        interactionEvents.push(event)
        break
    }
  }

  processDOMEvents(domEvents)
  processInteractionEvents(interactionEvents)
  Stats.sample('process events: duration', performance.now() - start)
}
