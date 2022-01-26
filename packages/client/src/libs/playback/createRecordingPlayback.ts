import { animationFrames, connectable, NEVER, Subscription } from 'rxjs'
import { map, pairwise, switchMap } from 'rxjs/operators'
import { Stats } from '@/libs/diagnostics'
import {
  Sample,
  Snapshot,
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
} from '@/types/recording'
import { ArrayBufferBackedList, copyObject } from '@/utils/lang'
import { applyEventToSnapshot, isSample } from '@/utils/source'
import { createAtom } from '@/utils/state'
import { ControlFrame, Playback, PlaybackState } from './types'
import {
  decodeEvent,
  encodeEvent,
  readEventTime,
  readEventType,
} from '../codecs/event'
import { BufferReader } from 'arraybuffer-utils'
import { LITTLE_ENDIAN } from '../codecs/common'

const EMPTY_SNAPSHOT: Snapshot = {
  dom: null,
}

const EMPTY_BUFFER: Array<SourceEvent> = []

function eventReader(buffer: ArrayBuffer): SourceEvent {
  const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
  return decodeEvent(reader)
}

function eventWriter(event: SourceEvent): ArrayBuffer {
  return encodeEvent(event)
}

const EMPTY_EVENT_LIST = new ArrayBufferBackedList<SourceEvent>(
  [],
  eventReader,
  eventWriter
)

export const EMPTY_PLAYBACK = createRecordingPlayback(EMPTY_EVENT_LIST)

export function createRecordingPlayback(
  events: ArrayBufferBackedList<SourceEvent>
): Playback {
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
      duration = readEventTime(lastEvent) - readEventTime(firstEvent)
    }
  })

  const snapshotIndex: Array<number> = []

  Stats.time('RecordingPlayback: index snapshot events', () => {
    for (let i = 0, len = events.size(); i < len; i++) {
      const event = events.at(i)

      if (event && readEventType(event) === SourceEventType.Snapshot) {
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

    const firstEvent = events.read(0)

    if (!firstEvent || firstEvent.type !== SourceEventType.Snapshot) {
      throw new Error(
        'Playback: could not find leading snapshot in events (index = 0)'
      )
    }

    return firstEvent.data
  }

  function partitionEvents(
    events: ArrayBufferBackedList<SourceEvent>,
    shouldPartition: (buffer: ArrayBuffer, index: number) => boolean,
    isUnresolvedSample: (sample: Sample<any>, time: number) => boolean
  ) {
    const eventsBefore: Array<SourceEvent> = []
    const eventsAfter = events.slice()
    const unresolvedSampleEvents: Array<SourceEvent> = []

    let buffer: ArrayBuffer | null
    let i = 0

    while ((buffer = eventsAfter.at(0))) {
      if (readEventType(buffer) === SourceEventType.Snapshot) {
        eventsAfter.shift()
        continue
      }

      if (shouldPartition(buffer, i)) {
        break
      }

      const event = eventsAfter.read(0)

      if (!event) {
        break
      }

      eventsBefore.push(event)

      if (
        'data' in event &&
        isSample(event.data) &&
        isUnresolvedSample(event.data, event.time)
      ) {
        unresolvedSampleEvents.push(event)
      }

      eventsAfter.shift()
      i++
    }

    eventsAfter.unshift(...unresolvedSampleEvents)

    return [eventsBefore, eventsAfter] as const
  }

  let queuedEvents: ArrayBufferBackedList<SourceEvent> = loadEvents()

  const eventLoop = connectable(
    $playbackState.pipe(
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
        buffer => readEventTime(buffer) > elapsed,
        (sample, time) => time + sample.duration > elapsed
      )

      queuedEvents = after
      setBuffer(before)
      setActveIndex(activeIndex => activeIndex + before.length)
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
    return event ? readEventTime(event) : null
  }

  function getEventTypeAtIndex(index: number) {
    const event = events.at(index)
    return event ? readEventType(event) : null
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

    const targetEvent = queuedEvents.read(nextIndex)

    if (!targetEvent) {
      throw new Error(`Playback: could not find event at index ${nextIndex}`)
    }

    let snapshot: Snapshot | null = null

    for (let i = snapshotIndex.length - 1; i >= 0; i--) {
      const index = snapshotIndex[i]

      if (typeof index === 'number') {
        if (index <= nextIndex) {
          snapshot = (allEvents.read(index) as SnapshotEvent).data
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
    Stats.time('RecordingPlayback: seek to time', () => {
      setBuffer(EMPTY_BUFFER)
      const allEvents = loadEvents()
      queuedEvents = allEvents

      let snapshot: Snapshot | null = null

      for (let i = snapshotIndex.length - 1; i >= 0; i--) {
        const index = snapshotIndex[i]

        if (typeof index === 'number') {
          const buffer = allEvents.at(index)

          if (buffer && readEventTime(buffer) <= elapsed) {
            snapshot = (allEvents.read(index) as SnapshotEvent).data
            queuedEvents = allEvents.slice(index + 1)
            break
          }
        }
      }

      const [before, after] = partitionEvents(
        queuedEvents,
        buffer => readEventTime(buffer) > elapsed,
        (sample, time) => time + sample.duration > elapsed
      )

      queuedEvents = after

      if (snapshot && before.length) {
        snapshot = copyObject(snapshot)

        for (const event of before) {
          applyEventToSnapshot(snapshot, event, elapsed)
        }
      }

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
    return createRecordingPlayback(events)
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
