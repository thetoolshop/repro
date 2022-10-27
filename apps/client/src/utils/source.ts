import {
  InteractionType,
  Point,
  PointerState,
  DOMPatchEvent,
  InteractionEvent,
  Sample,
  Snapshot,
  SourceEvent,
  SourceEventType,
} from '@repro/domain'
import { v4 as uuidv4 } from 'uuid'

import { copyArray } from '~/utils/lang'
import { applyVTreePatch } from '~/utils/vdom'

export function createRecordingId() {
  return uuidv4()
}

export function createEmptySnapshot(): Snapshot {
  return {
    dom: null,
    interaction: null,
  }
}

export function isSample(data: object): data is Sample<any> {
  return 'from' in data && 'to' in data && 'duration' in data
}

export function interpolatePointFromSample(
  sample: Sample<Point>,
  time: number,
  elapsed: number
): Point {
  const { duration, from: fromValue, to: toValue } = sample

  // If sample window has already expired or duration is 0, jump to end value
  if (time + duration < elapsed || duration === 0) {
    return copyArray(toValue) as Point
  } else {
    const adjustment = (elapsed - time) / duration

    const offsetValue: Point = [
      fromValue[0] + (toValue[0] - fromValue[0]) * adjustment,
      fromValue[1] + (toValue[1] - fromValue[1]) * adjustment,
    ]

    return offsetValue
  }
}

function applyDOMEventToSnapshot(
  snapshot: Snapshot,
  event: DOMPatchEvent,
  revert: boolean = false
) {
  if (snapshot.dom) {
    applyVTreePatch(snapshot.dom, event.data, revert)
  }
}

function applyInteractionEventToSnapshot(
  snapshot: Snapshot,
  event: InteractionEvent,
  elapsed: number
) {
  if (snapshot.interaction) {
    switch (event.data.type) {
      case InteractionType.PointerMove:
        snapshot.interaction.pointer = interpolatePointFromSample(
          event.data,
          event.time,
          elapsed
        )
        break

      case InteractionType.PointerDown:
        snapshot.interaction.pointer = event.data.at
        snapshot.interaction.pointerState = PointerState.Down
        break

      case InteractionType.PointerUp:
        snapshot.interaction.pointer = event.data.at
        snapshot.interaction.pointerState = PointerState.Up
        break

      case InteractionType.ViewportResize:
        snapshot.interaction.viewport = interpolatePointFromSample(
          event.data,
          event.time,
          elapsed
        )
        break

      case InteractionType.Scroll:
        snapshot.interaction.scroll[event.data.target] =
          interpolatePointFromSample(event.data, event.time, elapsed)
        break
    }
  }
}

export function applyEventToSnapshot(
  snapshot: Snapshot,
  event: SourceEvent,
  elapsed: number,
  revert: boolean = false
) {
  switch (event.type) {
    case SourceEventType.DOMPatch:
      applyDOMEventToSnapshot(snapshot, event, revert)
      break

    case SourceEventType.Interaction:
      applyInteractionEventToSnapshot(snapshot, event, elapsed)
      break
  }
}
