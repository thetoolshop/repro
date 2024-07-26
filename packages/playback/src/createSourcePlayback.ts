import { createAtom } from '@repro/atom'
import { Stats, StatsLevel } from '@repro/diagnostics'
import {
  Snapshot,
  SnapshotEvent,
  SnapshotView,
  SourceEvent,
  SourceEventType,
  SourceEventView,
} from '@repro/domain'
import {
  Sample,
  applyEventToSnapshot,
  createEmptySnapshot,
  isSample,
} from '@repro/source-utils'
import { LazyList, copyObject } from '@repro/std'
import {
  NEVER,
  Subscription,
  animationFrames,
  asyncScheduler,
  connectable,
} from 'rxjs'
import { map, observeOn, pairwise, switchMap } from 'rxjs/operators'
import { ControlFrame, Playback, PlaybackState } from './types'

const EMPTY_SNAPSHOT = createEmptySnapshot()

const EMPTY_BUFFER = LazyList.Empty(
  SourceEventView.decode,
  SourceEventView.encode
)

export const EMPTY_PLAYBACK = createSourcePlayback(
  LazyList.Empty<SourceEvent>(),
  {}
)

export function createSourcePlayback(
  events: LazyList<SourceEvent>,
  resourceMap: Record<string, string>
): Playback {
  const subscription = new Subscription()

  const [$activeIndex, setActiveIndex, getActiveIndex] = createAtom(-1)
  const [$buffer, setBuffer, getBuffer] = createAtom(
    LazyList.Empty(SourceEventView.decode, SourceEventView.encode)
  )
  const [$elapsed, setElapsed, getElapsed] = createAtom(-1)
  const [$playbackState, setPlaybackState, getPlaybackState] = createAtom(
    PlaybackState.Paused
  )
  const [$snapshot, setSnapshot, getSnapshot] = createAtom<Snapshot>(
    getLeadingSnapshot()
  )
  const [$latestControlFrame, setLatestControlFrame, getLatestControlFrame] =
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
    const eventsBefore = LazyList.Empty(
      SourceEventView.decode,
      SourceEventView.encode
    )

    const eventsAfter = events.slice()

    Stats.time(
      'RecordingPlayback~partitionEvents: total',
      () => {
        const unresolvedSampleEvents: Array<SourceEvent> = []

        let view: DataView | null
        let i = 0

        while ((view = eventsAfter.at(0))) {
          const lens = SourceEventView.over(view)

          if (shouldPartition(lens, i)) {
            break
          }

          eventsBefore.append(lens)

          if (
            'data' in lens &&
            isSample(lens.data) &&
            isUnresolvedSample(lens.data, lens.time)
          ) {
            unresolvedSampleEvents.push(lens)
          }

          eventsAfter.delete(0)
          i++
        }

        eventsAfter.prepend(...unresolvedSampleEvents)
      },
      StatsLevel.Debug
    )

    return [eventsBefore, eventsAfter] as const
  }

  let mutexLock = false

  function withMutexLock(callback: () => void) {
    mutexLock = true
    callback()
    mutexLock = false
  }

  function unlessMutexLock(callback: () => void) {
    if (!mutexLock) {
      callback()
    }
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
      unlessMutexLock(() => {
        // TODO: investigate performance implications (especially after
        // resuming background/idle tab)
        const [before, after] = partitionEvents(
          queuedEvents,
          event => event.time > elapsed,
          (sample, time) => time + sample.duration > elapsed
        )

        queuedEvents = after

        setBuffer(before)
        setActiveIndex(activeIndex => activeIndex + before.size())
      })

      if (elapsed >= duration) {
        setPlaybackState(PlaybackState.Paused)
      }
    })
  )

  subscription.add(
    $buffer.subscribe(events => {
      const elapsed = getElapsed()

      if (events.size()) {
        const snapshot = copyObject(getSnapshot())

        for (const dataView of events.toSource()) {
          const event = SourceEventView.over(dataView)
          applyEventToSnapshot(snapshot, event, elapsed)
        }

        setSnapshot(snapshot)
      }
    })
  )

  // TODO: optimize this
  function getEventIndexAtTime(time: number) {
    const dataViews = events.toSource()

    for (let i = dataViews.length - 1; i >= 0; i--) {
      const dataView = dataViews[i]

      if (dataView) {
        const event = SourceEventView.over(dataView)

        if (event.time <= time) {
          return i
        }
      }
    }

    return null
  }

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

  function getResourceMap() {
    return resourceMap
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

    if (snapshot && before.size()) {
      snapshot = copyObject(snapshot)

      for (const dataView of before.toSource()) {
        const event = SourceEventView.over(dataView)
        applyEventToSnapshot(snapshot, event, targetEvent.time)
      }
    }

    setSnapshot(snapshot || EMPTY_SNAPSHOT)
    setActiveIndex(nextIndex)

    withMutexLock(() => {
      setElapsed(targetEvent.time)
    })

    setLatestControlFrame(ControlFrame.SeekToEvent)

    Stats.value('Playback: seek to event', performance.now() - start)
  }

  function seekToTime(elapsed: number) {
    Stats.time('RecordingPlayback#seekToTime: total', () => {
      setBuffer(EMPTY_BUFFER)
      const allEvents = loadEvents()
      queuedEvents = allEvents

      let activeIndexOffset = 0
      let snapshot: Snapshot | null = null

      Stats.time('RecordingPlayback#seekToTime: find nearest snapshot', () => {
        for (let i = snapshotIndex.length - 1; i >= 0; i--) {
          const index = snapshotIndex[i]

          if (typeof index === 'number') {
            const event = allEvents.at(index)

            if (event && SourceEventView.over(event).time <= elapsed) {
              snapshot = (allEvents.decode(index) as SnapshotEvent).data
              queuedEvents = allEvents.slice(index + 1)
              activeIndexOffset = index + 1

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
        before.size()
      )

      Stats.time(
        'RecordingPlayback#seekToTime: apply events to snapshot',
        () => {
          if (snapshot && before.size()) {
            snapshot = copyObject(SnapshotView.decode(snapshot))

            for (const dataView of before.toSource()) {
              const event = SourceEventView.over(dataView)
              applyEventToSnapshot(snapshot, event, elapsed)
            }
          }
        }
      )

      setSnapshot(snapshot || EMPTY_SNAPSHOT)
      setActiveIndex(activeIndexOffset + before.size())

      withMutexLock(() => {
        setElapsed(elapsed)
      })

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
    return createSourcePlayback(events, resourceMap)
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
    getEventIndexAtTime,
    getEventTimeAtIndex,
    getEventTypeAtIndex,
    getLatestControlFrame,
    getPlaybackState,
    getResourceMap,
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
