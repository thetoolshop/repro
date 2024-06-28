import { createAtom } from '@repro/atom'
import { createBuffer } from '@repro/buffer-utils'
import {
  Snapshot,
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
  SourceEventView,
} from '@repro/domain'
import {
  applyEventToSnapshot,
  createEmptySnapshot,
  isSample,
} from '@repro/source-utils'
import { LazyList, copyObject } from '@repro/std'
import { Observable, Subscription, first, skipUntil } from 'rxjs'
import { ControlFrame, Playback, PlaybackState } from './types'

const MAX_EVENT_BUFFER_SIZE_BYTES = 32_000_000

export function createLivePlayback(event$: Observable<SourceEvent>): Playback {
  const [$activeIndex, _setActiveIndex, getActiveIndex] = createAtom(-1)
  const [$buffer, setBuffer, getBuffer] = createAtom(
    LazyList.Empty(SourceEventView.decode, SourceEventView.encode)
  )
  const [$elapsed, setElapsed, getElapsed] = createAtom(0)
  const [$latestControlFrame, setLatestControlFrame, getLatestControlFrame] =
    createAtom(ControlFrame.Idle)
  const [$playbackState, _setPlaybackState, getPlaybackState] = createAtom(
    PlaybackState.Playing
  )

  let leadingSnapshot = createEmptySnapshot()
  const [$snapshot, setSnapshot, getSnapshot] = createAtom<Snapshot>(
    createEmptySnapshot()
  )

  const sourceEventBuffer = createBuffer<SourceEvent>(
    MAX_EVENT_BUFFER_SIZE_BYTES
  )

  function getDuration() {
    return Infinity
  }

  function getEventTimeAtIndex() {
    return null
  }

  function getEventTypeAtIndex() {
    return null
  }

  function getSourceEvents() {
    const events = sourceEventBuffer.copy()

    if (events[0]?.type !== SourceEventType.Snapshot) {
      events.unshift({
        type: SourceEventType.Snapshot,
        time: events[0]?.time ?? 0,
        data: leadingSnapshot,
      })
    }

    return new LazyList(events, SourceEventView.over, SourceEventView.encode)
  }

  function getResourceMap() {
    return {}
  }

  function play() {}
  function pause() {}

  function seekToEvent() {
    setLatestControlFrame(ControlFrame.SeekToEvent)
  }

  function seekToTime() {
    setLatestControlFrame(ControlFrame.SeekToTime)
  }

  const subscription = new Subscription()

  function isSnapshotEvent(event: SourceEvent): event is SnapshotEvent {
    return event.type === SourceEventType.Snapshot
  }

  function open() {
    const initialSnapshot$ = event$.pipe(first(isSnapshotEvent))

    subscription.add(
      initialSnapshot$.subscribe(event => {
        const decoded = SourceEventView.decode(event) as SnapshotEvent
        setSnapshot(decoded.data)
        leadingSnapshot = copyObject(decoded.data)
      })
    )

    // TODO: batch events on animation frame
    subscription.add(
      event$.pipe(skipUntil(initialSnapshot$)).subscribe(event => {
        let trailingSnapshot = copyObject(getSnapshot())
        applyEventToSnapshot(trailingSnapshot, event, event.time)

        setSnapshot(trailingSnapshot)

        // Sampled events are offset by their duration to ensure correct
        // interpolation during recorded playback. For live playback, we
        // should shift elapsed time to the end of the interpolation window
        // to avoid missed frames.
        const elapsed = isSample(event.data)
          ? event.time + event.data.duration
          : event.time

        setElapsed(elapsed)
        setBuffer(
          new LazyList([event], SourceEventView.decode, SourceEventView.encode)
        )

        sourceEventBuffer.push(event)
      })
    )

    subscription.add(
      sourceEventBuffer.onEvict(evicted => {
        for (const event of evicted) {
          applyEventToSnapshot(leadingSnapshot, event, event.time)
        }
      })
    )
  }

  function close() {
    subscription.unsubscribe()
  }

  function copy() {
    return createLivePlayback(event$)
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
