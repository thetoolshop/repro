import { animationFrames, connectable, NEVER, Subscription } from 'rxjs'
import { map, pairwise, switchMap } from 'rxjs/operators'
import { Stats } from '@/libs/diagnostics'
import {
  Recording,
  Sample,
  Snapshot,
  SnapshotEvent,
  SourceEvent,
} from '@/types/recording'
import { copyObject, copyObjectDeep, List } from '@/utils/lang'
import { applyEventToSnapshot, isSample } from '@/utils/source'
import { createAtom } from '@/utils/state'
import { ControlFrame, Playback, PlaybackState } from './types'
import { createEmptyRecording } from '../record'

const EMPTY_SNAPSHOT: Snapshot = {
  dom: null,
}

const EMPTY_BUFFER: Array<SourceEvent> = []

export const EMPTY_PLAYBACK = createRecordingPlayback(createEmptyRecording())

export function createRecordingPlayback(recording: Recording): Playback {
  const subscription = new Subscription()

  const [$activeIndex, getActiveIndex, setActveIndex] = createAtom(-1)
  const [$buffer, getBuffer, setBuffer] = createAtom<Array<SourceEvent>>([])
  const [$elapsed, getElapsed, setElapsed] = createAtom(0)
  const [$playbackState, getPlaybackState, setPlaybackState] = createAtom(
    PlaybackState.Paused
  )
  const [$snapshot, getSnapshot, setSnapshot] =
    createAtom<Snapshot>(EMPTY_SNAPSHOT)
  const [$latestControlFrame, getLatestControlFrame, setLatestControlFrame] =
    createAtom<ControlFrame>(ControlFrame.Pause)

  function loadEvents() {
    return recording.events.slice()
  }

  function partitionEvents(
    events: List<SourceEvent>,
    shouldPartition: (event: SourceEvent, index: number) => boolean,
    isUnresolvedSample: (sample: Sample<any>, time: number) => boolean
  ) {
    const eventsBefore: Array<SourceEvent> = []
    const eventsAfter = events.slice()
    const unresolvedSampleEvents: Array<SourceEvent> = []

    let event: SourceEvent | null
    let i = 0

    while ((event = eventsAfter.get(0))) {
      if (shouldPartition(event, i)) {
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

  let queuedEvents: List<SourceEvent> = loadEvents()

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
      setElapsed(elapsed => Math.min(recording.duration, elapsed + delta))
    })
  )

  subscription.add(
    $elapsed.subscribe(elapsed => {
      if (recording.duration > 0 && elapsed >= recording.duration) {
        setPlaybackState(PlaybackState.Done)
      }
    })
  )

  subscription.add(
    $elapsed.subscribe(elapsed => {
      const [before, after] = partitionEvents(
        queuedEvents,
        event => event.time > elapsed,
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

  function getDuration() {
    return recording.duration
  }

  function play() {
    setPlaybackState(PlaybackState.Playing)
    setLatestControlFrame(ControlFrame.Play)
  }

  function pause() {
    setPlaybackState(PlaybackState.Paused)
    setLatestControlFrame(ControlFrame.Pause)
  }

  function seekToEvent(nextIndex: number) {
    const start = performance.now()

    setBuffer(EMPTY_BUFFER)
    const allEvents = loadEvents()
    queuedEvents = allEvents

    const targetEvent = queuedEvents.get(nextIndex)

    if (!targetEvent) {
      throw new Error(`Replay: could not find event at index ${nextIndex}`)
    }

    let snapshot: Snapshot | null = null

    for (const index of recording.snapshotIndex) {
      if (index <= nextIndex) {
        snapshot = (allEvents.get(index) as SnapshotEvent).data
        queuedEvents = allEvents.slice(index)
      }
    }

    const [before, after] = partitionEvents(
      queuedEvents,
      (_, index) => index > nextIndex,
      (sample, time) => time + sample.duration > targetEvent.time
    )

    queuedEvents = after

    if (snapshot) {
      snapshot = copyObject(snapshot)

      for (const event of before) {
        applyEventToSnapshot(snapshot, event, targetEvent.time)
      }
    }

    setSnapshot(snapshot || EMPTY_SNAPSHOT)
    setActveIndex(before.length - 1)
    setElapsed(targetEvent.time)
    setLatestControlFrame(ControlFrame.SeekToEvent)

    Stats.value('Replay: seek to event', performance.now() - start)
  }

  function seekToTime(elapsed: number) {
    const start = performance.now()

    setBuffer(EMPTY_BUFFER)
    const allEvents = loadEvents()
    queuedEvents = allEvents

    let snapshot: Snapshot | null = null

    for (const index of recording.snapshotIndex) {
      const event = allEvents.get(index) as SnapshotEvent

      if (event.time <= elapsed) {
        snapshot = event.data
        queuedEvents = allEvents.slice(index)
      }
    }

    const [before, after] = partitionEvents(
      queuedEvents,
      event => event.time > elapsed,
      (sample, time) => time + sample.duration > elapsed
    )

    queuedEvents = after

    if (snapshot) {
      snapshot = copyObject(snapshot)

      for (const event of before) {
        applyEventToSnapshot(snapshot, event, elapsed)
      }
    }

    setSnapshot(snapshot || EMPTY_SNAPSHOT)
    setActveIndex(before.length - 1)
    setElapsed(elapsed)
    setLatestControlFrame(ControlFrame.SeekToTime)

    Stats.value('Replay: seek to time', performance.now() - start)
  }

  function open() {
    subscription.add(eventLoop.connect())
  }

  function close() {
    subscription.unsubscribe()
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
    getLatestControlFrame,
    getPlaybackState,
    getSnapshot,

    // Services
    play,
    pause,
    seekToEvent,
    seekToTime,

    // Lifecycle
    open,
    close,
  }
}
