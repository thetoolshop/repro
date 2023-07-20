import {
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
  SourceEventView,
} from '@repro/domain'
import { LazyList } from '@repro/std'
import { copy as copyDataView } from '@repro/typed-binary-encoder'
import { Stats } from '~/libs/diagnostics'
import { applyEventToSnapshot } from '~/utils/source'

export function sliceEventsAtRange(
  sourceEvents: LazyList<SourceEvent>,
  range: [number, number]
): LazyList<SourceEvent> {
  const eventBuffers: Array<DataView> = []

  Stats.time(
    'libs/record ~ sliceEventsAtRange: create recording from range',
    () => {
      let leadingSnapshotBuffer: DataView | null = null
      const leadingEventBuffers: Array<DataView> = []

      let trailingSnapshotBuffer: DataView | null = null
      const trailingEventBuffers: Array<DataView> = []

      for (let i = 0, len = sourceEvents.size(); i < len; i++) {
        const event = sourceEvents.at(i)

        if (event) {
          const lens = SourceEventView.over(event)
          const time = lens.time
          const type = lens.type

          if (time <= range[0]) {
            if (type === SourceEventType.Snapshot) {
              leadingSnapshotBuffer = copyDataView(event)
              leadingEventBuffers.length = 0
            } else {
              leadingEventBuffers.push(event)
            }
          } else if (time > range[0] && time < range[1]) {
            eventBuffers.push(copyDataView(event))
          } else if (time >= range[1]) {
            if (trailingSnapshotBuffer === null) {
              if (type === SourceEventType.Snapshot) {
                trailingSnapshotBuffer = copyDataView(event)
              } else {
                trailingEventBuffers.unshift(event)
              }
            }
          }
        }
      }

      if (!leadingSnapshotBuffer || !trailingSnapshotBuffer) {
        throw new Error(
          'libs/record ~ sliceEventsAtRange: cannot find leading or trailing snapshot'
        )
      }

      if (leadingEventBuffers.length > 0) {
        const leadingSnapshotEvent = SourceEventView.decode(
          leadingSnapshotBuffer
        ) as SnapshotEvent

        for (const buffer of leadingEventBuffers) {
          const event = SourceEventView.decode(buffer)
          applyEventToSnapshot(leadingSnapshotEvent.data, event, event.time)
          leadingSnapshotEvent.time = event.time
        }

        leadingSnapshotBuffer = SourceEventView.encode(leadingSnapshotEvent)
      }

      if (trailingEventBuffers.length > 0) {
        const trailingSnapshotEvent = SourceEventView.decode(
          trailingSnapshotBuffer
        ) as SnapshotEvent

        for (const buffer of trailingEventBuffers) {
          const event = SourceEventView.decode(buffer)
          applyEventToSnapshot(
            trailingSnapshotEvent.data,
            event,
            event.time,
            true
          )
          trailingSnapshotEvent.time = event.time
        }

        trailingSnapshotBuffer = SourceEventView.encode(trailingSnapshotEvent)
      }

      eventBuffers.unshift(leadingSnapshotBuffer)
      eventBuffers.push(trailingSnapshotBuffer)

      const firstEvent = eventBuffers[0]
      const timeOffset = firstEvent ? SourceEventView.over(firstEvent).time : 0

      for (const event of eventBuffers) {
        SourceEventView.over(event).time -= timeOffset
      }
    }
  )

  return new LazyList(
    eventBuffers,
    SourceEventView.decode,
    SourceEventView.encode
  )
}
