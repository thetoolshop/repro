import { DOMSnapshotEvent, Recording, SourceEvent, SourceEventType } from '@/types/recording'
import { copy } from '@/utils/lang'
import { createSetter } from '@/utils/state'
import {applyVTreePatch} from '@/utils/vdom'

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

  while (event = events[0]) {
    if (event.time > time) {
      break
    }

    handleEvent(event, time)
    events.shift()
    activeIndex++
  }

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

  while (event = events[i]) {
    elapsed = event.time

    if (i === nextIndex) {
      break
    }

    i++
  }

  i = 0

  while (event = events.shift()) {
    handleEvent(event, elapsed)

    if (i === nextIndex) {
      break
    }

    i++
  }

  $buffer.next(events)
  $activeIndex.next(nextIndex)
  setElapsed(elapsed)
}

export const init = (recording: Recording) => {
  setRecording(recording)
  seekToTime(0)
}

export const handleEvent = (event: SourceEvent, elapsed: number) => {
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

    case SourceEventType.Interaction:
      // TODO:
      // For sampled events:
      // - interpolate initial state based on elapsed time
      // - init animation to target state
      break
  }
}
