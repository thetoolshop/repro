import {
  Snapshot,
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
} from '@/types/recording'
import { copyObject } from '@/utils/lang'
import { applyEventToSnapshot } from '@/utils/source'
import { createAtom } from '@/utils/state'
import { first, Observable, skipUntil, Subscription } from 'rxjs'
import { ControlFrame, Playback, PlaybackState } from './types'

const EMPTY_SNAPSHOT: Snapshot = {
  dom: null,
}

export function createLivePlayback(event$: Observable<SourceEvent>): Playback {
  const [$activeIndex, getActiveIndex] = createAtom(-1)
  const [$buffer, getBuffer, setBuffer] = createAtom<Array<SourceEvent>>([])
  const [$elapsed, getElapsed, setElapsed] = createAtom(0)
  const [$latestControlFrame, getLatestControlFrame] = createAtom(
    ControlFrame.Idle
  )
  const [$playbackState, getPlaybackState] = createAtom(PlaybackState.Playing)
  const [$snapshot, getSnapshot, setSnapshot] =
    createAtom<Snapshot>(EMPTY_SNAPSHOT)

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
    return null
  }

  function play() {}
  function pause() {}
  function seekToEvent() {}
  function seekToTime() {}

  const subscription = new Subscription()

  function isSnapshotEvent(event: SourceEvent): event is SnapshotEvent {
    return event.type === SourceEventType.Snapshot
  }

  function open() {
    const initialSnapshot$ = event$.pipe(first(isSnapshotEvent))

    subscription.add(
      initialSnapshot$.subscribe(event => {
        setSnapshot(event.data)
      })
    )

    // TODO: batch events on animation frame
    subscription.add(
      event$.pipe(skipUntil(initialSnapshot$)).subscribe(event => {
        let trailingSnapshot = copyObject(getSnapshot())
        applyEventToSnapshot(trailingSnapshot, event, event.time)

        setSnapshot(trailingSnapshot)
        setElapsed(event.time)
        setBuffer([event])
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
