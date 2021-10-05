import { InteractionType, Point, Sample } from '@/types/interaction'
import { DOMPatchEvent, DOMSnapshotEvent, DOMSourceEvent, InteractionEvent, Recording, SourceEvent, SourceEventType } from '@/types/recording'
import { copyArray, copyObject, copyObjectDeep } from '@/utils/lang'
import { createSetter } from '@/utils/state'
import { applyVTreePatch } from '@/utils/vdom'
import { Stats } from '../stats'

import {
  $buffer,
  $activeIndex,
  $elapsed,
  $focusedNode,
  $playbackState,
  $pointer,
  $readyState,
  $recording,
  $snapshot,
  $source,
  $viewport,
  PlaybackState,
} from './state'

export const getBuffer = () => $buffer.getValue()
export const setBuffer = createSetter($buffer)
export const setActiveIndex = createSetter($activeIndex)
export const setSource = createSetter($source)
export const getElapsed = () => $elapsed.getValue()
export const setElapsed = createSetter($elapsed)
export const setFocusedNode = createSetter($focusedNode)
export const setPlaybackState = createSetter($playbackState)
export const getPointer = () => $pointer.getValue()
export const setPointer = createSetter($pointer)
export const setReadyState = createSetter($readyState)
export const setRecording = createSetter($recording)
export const getSnapshot = () => $snapshot.getValue()
export const setSnapshot = createSetter($snapshot)
export const getViewport = () => $viewport.getValue()
export const setViewport = createSetter($viewport)

export const seekToTime = (time: number) => {
  const recording = $recording.getValue()
  let activeIndex = -1
  let events = copyArray(recording.events)
  let event: SourceEvent | undefined

  for (const index of recording.snapshotIndex) {
    const snapshot = events[index] as DOMSnapshotEvent | undefined

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

  processEvents(queue)

  setBuffer(events)
  $activeIndex.next(activeIndex)
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
    events.shift()
    i++
  }

  processEvents(queue)

  setBuffer(events)
  $activeIndex.next(nextIndex)
  setElapsed(elapsed)
}

export const init = (recording: Recording) => {
  setRecording(recording)
  setPointer([0, 0])
  setViewport([0, 0])
  setPlaybackState(PlaybackState.Paused)
  seekToTime(0)
}

function processDOMEvents(events: Array<DOMSourceEvent>) {
  const start = performance.now()
  let queue: Array<DOMSourceEvent> = []
  let snapshot = getSnapshot()
  let dirty = false

  for (const event of events) {
    if (event.type === SourceEventType.DOMSnapshot) {
      queue = []
    }

    queue.push(event)
  }

  for (const event of events) {
    switch (event.type) {
      case SourceEventType.DOMSnapshot:
        snapshot = copyObjectDeep(event.data)
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

function processInteractionEvents(events: Array<InteractionEvent>) {
  const start = performance.now()

  const elapsed = getElapsed()
  let viewport = getViewport()
  let pointer = getPointer()

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
    switch (event.data.type) {
      case InteractionType.PointerMove:
        pointer = interpolatePointFromSample(
          event.data.from,
          event.data.to,
          event.time
        )
        break

      case InteractionType.ViewportResize:
        viewport = interpolatePointFromSample(
          event.data.from,
          event.data.to,
          event.time
        )
        break
    }
  }

  setViewport(viewport)
  setPointer(pointer)
  Stats.sample('process interaction events: duration', performance.now() - start)
}

export function processEvents(events: Array<SourceEvent>) {
  if (events.length === 0) {
    return
  }

  const start = performance.now() 

  const domEvents: Array<DOMSourceEvent> = []
  const interactionEvents: Array<InteractionEvent> = []

  for (const event of events) {
    switch (event.type) {
      case SourceEventType.DOMSnapshot:
        domEvents.push(event)
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
