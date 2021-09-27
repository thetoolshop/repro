import { DOMSnapshotEvent, Recording, SourceEvent, SourceEventType } from '@/types/recording'
import { copy } from '@/utils/lang'
import { createSetter } from '@/utils/state'
import {applyVTreePatch} from '@/utils/vdom'
import {Stats} from '../stats'

import {
  $buffer,
  $activeIndex,
  $elapsed,
  $focusedNode,
  $playbackState,
  $readyState,
  $recording,
  $snapshot,
  $source,
} from './state'

export const getBuffer = () => $buffer.getValue()
export const setBuffer = createSetter($buffer)
export const setActiveIndex = createSetter($activeIndex)
export const setSource = createSetter($source)
export const setElapsed = createSetter($elapsed)
export const setFocusedNode = createSetter($focusedNode)
export const setPlaybackState = createSetter($playbackState)
export const setReadyState = createSetter($readyState)
export const setRecording = createSetter($recording)
export const getSnapshot = () => $snapshot.getValue()
export const setSnapshot = createSetter($snapshot)

export const seekToTime = (time: number) => {
  const recording = $recording.getValue()
  let activeIndex = -1
  let events = copy(recording.events)
  let event: SourceEvent | undefined

  for (const index of recording.snapshotIndex) {
    const snapshot = events[index] as DOMSnapshotEvent | undefined

    if (snapshot && snapshot.time <= time) {
      events = events.slice(index)
      continue
    }

    break
  }

  let processQueue: Array<SourceEvent> = []

  while (event = events[0]) {
    if (event.time > time) {
      break
    }
    
    processQueue.push(event)
    events.shift()
    activeIndex++
  }

  handleEvents(processQueue, time)

  $buffer.next(events)
  $activeIndex.next(activeIndex)
  setElapsed(time)
}

export const seekToEvent = (nextIndex: number) => {
  const recording = $recording.getValue()
  let events = copy(recording.events)
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

  let processQueue: Array<SourceEvent> = []

  while (event = events[0]) {
    if (i === nextIndex) {
      break
    }

    processQueue.push(event)
    events.shift()
    i++
  }

  handleEvents(processQueue, elapsed)

  $buffer.next(events)
  $activeIndex.next(nextIndex)
  setElapsed(elapsed)
}

export const init = (recording: Recording) => {
  setRecording(recording)
  seekToTime(0)
}

export const handleEvents = (events: Array<SourceEvent>, _elapsed: number) => {
  if (events.length === 0) {
    return
  }

  const start = performance.now() 
  let snapshot = getSnapshot()

  for (const event of events) {
    switch (event.type) {
      case SourceEventType.DOMSnapshot:
        snapshot = event.data
        break

      case SourceEventType.DOMPatch:
        const patch = event.data
        snapshot = snapshot
          ? applyVTreePatch(snapshot, patch)
          : null
        break

      case SourceEventType.Interaction:
        // TODO:
        // For sampled events:
        // - interpolate initial state based on elapsed time
        // - init animation to target state
        break
    }
  }

  Stats.sample('playback frame: duration', performance.now() - start)
  setSnapshot(snapshot)
}
