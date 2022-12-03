import {
  Sample,
  Snapshot,
  SnapshotEvent,
  SnapshotView,
  SourceEvent,
  SourceEventType,
  SourceEventView,
} from '@repro/domain'
import {
  animationFrames,
  asyncScheduler,
  connectable,
  NEVER,
  Subscription,
} from 'rxjs'
import { map, observeOn, pairwise, switchMap } from 'rxjs/operators'
import { Stats } from '~/libs/diagnostics'
import { copyObject, LazyList } from '~/utils/lang'
import { applyEventToSnapshot, isSample } from '~/utils/source'
import { createAtom } from '~/utils/state'
import { ControlFrame, Playback, PlaybackState } from './types'

const EMPTY_SNAPSHOT: Snapshot = {
  dom: null,
  interaction: null,
}

const EMPTY_BUFFER: Array<SourceEvent> = []

export const EMPTY_PLAYBACK = createSourcePlayback(
  LazyList.Empty<SourceEvent>()
)

export function createSourcePlayback(events: LazyList<SourceEvent>): Playback {
  const subscription = new Subscription()

  const [$activeIndex, getActiveIndex, setActveIndex] = createAtom(-1)
  const [$buffer, getBuffer, setBuffer] = createAtom<Array<SourceEvent>>([])
  const [$elapsed, getElapsed, setElapsed] = createAtom(-1)
  const [$playbackState, getPlaybackState, setPlaybackState] = createAtom(
    PlaybackState.Paused
  )
  const [$snapshot, getSnapshot, setSnapshot] = createAtom<Snapshot>(
    getLeadingSnapshot()
  )
  const [$latestControlFrame, getLatestControlFrame, setLatestControlFrame] =
    createAtom<ControlFrame>(ControlFrame.Idle)

  const firstEvent = events.at(0)
  const lastEvent = events.at(events.size() - 1)

  let duration = 0

  Stats.time('RecordingPlayback: calculate duration', () => {
    if (firstEvent && lastEvent) {
      duration =
        SourceEventView.over(lastEvent).time -
        SourceEventView.over(firstEvent).time
    }
  })

  const snapshotIndex: Array<number> = []

  Stats.time('RecordingPlayback: index snapshot events', () => {
    for (let i = 0, len = events.size(); i < len; i++) {
      const dataView = events.at(i)
      const event = dataView && SourceEventView.over(dataView)

      if (event && event.type === SourceEventType.Snapshot) {
        snapshotIndex.push(i)
      }
    }
  })

  function loadEvents() {
    return events.slice()
  }

  function getLeadingSnapshot() {
    if (events.size() === 0) {
      return EMPTY_SNAPSHOT
    }

    const firstEvent = events.decode(0)

    if (!firstEvent || firstEvent.type !== SourceEventType.Snapshot) {
      throw new Error(
        'Playback: could not find leading snapshot in events (index = 0)'
      )
    }

    return firstEvent.data
  }

  function partitionEvents(
    events: LazyList<SourceEvent>,
    shouldPartition: (event: SourceEvent, index: number) => boolean,
    isUnresolvedSample: (sample: Sample<any>, time: number) => boolean
  ) {
    const eventsBefore: Array<SourceEvent> = []
    const eventsAfter = events.slice()

    Stats.time('RecordingPlayback~partitionEvents: total', () => {
      const unresolvedSampleEvents: Array<SourceEvent> = []

      let view: DataView | null
      let i = 0

      while ((view = eventsAfter.at(0))) {
        const lens = SourceEventView.over(view)

        if (lens.type === SourceEventType.Snapshot) {
          eventsAfter.delete(0)
          continue
        }

        if (shouldPartition(lens, i)) {
          break
        }

        const event = eventsAfter.decode(0)

        if (!event) {
          break
        }

        eventsBefore.push(event)

        if (
          'data' in lens &&
          isSample(lens.data) &&
          isUnresolvedSample(lens.data, lens.time)
        ) {
          unresolvedSampleEvents.push(event)
        }

        eventsAfter.delete(0)
        i++
      }

      eventsAfter.prepend(...unresolvedSampleEvents)
    })

    return [eventsBefore, eventsAfter] as const
  }

  let queuedEvents: LazyList<SourceEvent> = loadEvents()

  const eventLoop = connectable(
    $playbackState.pipe(
      observeOn(asyncScheduler),
      switchMap(playbackState => {
        return playbackState !== PlaybackState.Playing
          ? NEVER
          : animationFrames().pipe(
              pairwise(),
              map(([prev, next]) => next.timestamp - prev.timestamp)
            )
      })
    )
  )

  subscription.add(
    eventLoop.subscribe(delta => {
      setElapsed(elapsed => Math.min(duration, elapsed + delta))
    })
  )

  subscription.add(
    $elapsed.subscribe(elapsed => {
      // TODO: investigate performance implications (especially after
      // resuming background/idle tab)
      const [before, after] = partitionEvents(
        queuedEvents,
        event => event.time > elapsed,
        (sample, time) => time + sample.duration > elapsed
      )

      queuedEvents = after
      setBuffer(before)
      setActveIndex(activeIndex => activeIndex + before.length)

      if (elapsed >= duration) {
        setPlaybackState(PlaybackState.Paused)
      }
    })
  )

  subscription.add(
    $buffer.subscribe(events => {
      const elapsed = getElapsed()

      if (events.length) {
        const snapshot = copyObject(getSnapshot())

        for (const event of events) {
          applyEventToSnapshot(snapshot, event, elapsed)
        }

        setSnapshot(snapshot)
      }
    })
  )

  function getEventTimeAtIndex(index: number) {
    const event = events.at(index)
    return event ? SourceEventView.over(event).time : null
  }

  function getEventTypeAtIndex(index: number) {
    const event = events.at(index)
    return event ? SourceEventView.over(event).type : null
  }

  function getSourceEvents() {
    return events
  }

  function getDuration() {
    return duration
  }

  function play() {
    setPlaybackState(PlaybackState.Playing)
  }

  function pause() {
    setPlaybackState(PlaybackState.Paused)
  }

  function seekToEvent(nextIndex: number) {
    const start = performance.now()

    setBuffer(EMPTY_BUFFER)
    const allEvents = loadEvents()
    queuedEvents = allEvents

    const targetEvent = queuedEvents.decode(nextIndex)

    if (!targetEvent) {
      throw new Error(`Playback: could not find event at index ${nextIndex}`)
    }

    let snapshot: Snapshot | null = null

    for (let i = snapshotIndex.length - 1; i >= 0; i--) {
      const index = snapshotIndex[i]

      if (typeof index === 'number') {
        if (index <= nextIndex) {
          snapshot = (allEvents.decode(index) as SnapshotEvent).data
          queuedEvents = allEvents.slice(index + 1)
          break
        }
      }
    }

    const [before, after] = partitionEvents(
      queuedEvents,
      (_, index) => index > nextIndex,
      (sample, time) => time + sample.duration > targetEvent.time
    )

    queuedEvents = after

    if (snapshot && before.length) {
      snapshot = copyObject(snapshot)

      for (const event of before) {
        applyEventToSnapshot(snapshot, event, targetEvent.time)
      }
    }

    setSnapshot(snapshot || EMPTY_SNAPSHOT)
    setActveIndex(before.length - 1)
    setElapsed(targetEvent.time)
    setLatestControlFrame(ControlFrame.SeekToEvent)

    Stats.value('Playback: seek to event', performance.now() - start)
  }

  function seekToTime(elapsed: number) {
    Stats.time('RecordingPlayback#seekToTime: total', () => {
      setBuffer(EMPTY_BUFFER)
      const allEvents = loadEvents()
      queuedEvents = allEvents

      let snapshot: Snapshot | null = null

      Stats.time('RecordingPlayback#seekToTime: find nearest snapshot', () => {
        for (let i = snapshotIndex.length - 1; i >= 0; i--) {
          const index = snapshotIndex[i]

          if (typeof index === 'number') {
            const event = allEvents.at(index)

            if (event && SourceEventView.over(event).time <= elapsed) {
              snapshot = (allEvents.decode(index) as SnapshotEvent).data
              queuedEvents = allEvents.slice(index + 1)

              Stats.value(
                'RecordingPlayback#seekToTime: snapshots read',
                snapshotIndex.length - i
              )

              break
            }
          }
        }
      })

      const [before, after] = partitionEvents(
        queuedEvents,
        event => event.time > elapsed,
        (sample, time) => time + sample.duration > elapsed
      )

      queuedEvents = after

      Stats.value(
        'RecordingPlayback#seekToTime: events to apply',
        before.length
      )

      Stats.time(
        'RecordingPlayback#seekToTime: apply events to snapshot',
        () => {
          if (snapshot && before.length) {
            snapshot = copyObject(SnapshotView.decode(snapshot))

            for (const event of before) {
              applyEventToSnapshot(snapshot, event, elapsed)
            }
          }
        }
      )

      setSnapshot(snapshot || EMPTY_SNAPSHOT)
      setActveIndex(before.length - 1)
      setElapsed(elapsed)
      setLatestControlFrame(ControlFrame.SeekToTime)
    })
  }

  function open() {
    subscription.add(eventLoop.connect())
  }

  function close() {
    subscription.unsubscribe()
  }

  function copy() {
    return createSourcePlayback(events)
  }

  return {
    // Read-only atoms
    $activeIndex,
    $buffer,
    $elapsed,
    $latestControlFrame,
    $playbackState,
    $snapshot,

    // Accessors
    getActiveIndex,
    getBuffer,
    getDuration,
    getElapsed,
    getEventTimeAtIndex,
    getEventTypeAtIndex,
    getLatestControlFrame,
    getPlaybackState,
    getSnapshot,
    getSourceEvents,

    // Services
    play,
    pause,
    seekToEvent,
    seekToTime,

    // Lifecycle
    open,
    close,

    // Operations
    copy,
  }
}
