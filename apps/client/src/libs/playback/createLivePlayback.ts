import {
  Snapshot,
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
} from '@repro/domain'
import { copyObject, LazyList } from '~/utils/lang'
import { applyEventToSnapshot } from '~/utils/source'
import { createAtom } from '~/utils/state'
import { first, Observable, skipUntil, Subscription } from 'rxjs'
import { ControlFrame, Playback, PlaybackState } from './types'

const EMPTY_SNAPSHOT: Snapshot = {
  dom: null,
}

export function createLivePlayback(event$: Observable<SourceEvent>): Playback {
  const [$activeIndex, _setActiveIndex, getActiveIndex] = createAtom(-1)
  const [$buffer, setBuffer, getBuffer] = createAtom<Array<SourceEvent>>([])
  const [$elapsed, setElapsed, getElapsed] = createAtom(0)
  const [$latestControlFrame, _setLatestControlFrame, getLatestControlFrame] =
    createAtom(ControlFrame.Idle)
  const [$playbackState, _getPlaybackState, getPlaybackState] = createAtom(
    PlaybackState.Playing
  )
  const [$snapshot, setSnapshot, getSnapshot] =
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
    return LazyList.Empty<SourceEvent>()
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
