import {
  Snapshot,
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
  SourceEventView,
} from '@repro/domain'
import { copyObject, LazyList } from '@repro/std'
import { applyEventToSnapshot, createEmptySnapshot } from '~/utils/source'
import { createAtom } from '~/utils/state'
import { first, Observable, skipUntil, Subscription } from 'rxjs'
import { ControlFrame, Playback, PlaybackState } from './types'

export function createLivePlayback(event$: Observable<SourceEvent>): Playback {
  const [$activeIndex, _setActiveIndex, getActiveIndex] = createAtom(-1)
  const [$buffer, setBuffer, getBuffer] = createAtom(
    LazyList.Empty(SourceEventView.decode, SourceEventView.encode)
  )
  const [$elapsed, setElapsed, getElapsed] = createAtom(0)
  const [$latestControlFrame, _setLatestControlFrame, getLatestControlFrame] =
    createAtom(ControlFrame.Idle)
  const [$playbackState, _setPlaybackState, getPlaybackState] = createAtom(
    PlaybackState.Playing
  )
  const [$currentPageURL, _setCurrentPageURL, getCurrentPageURL] =
    createAtom('')
  const [$snapshot, setSnapshot, getSnapshot] = createAtom<Snapshot>(
    createEmptySnapshot()
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
    return LazyList.Empty<SourceEvent>()
  }

  function getResourceMap() {
    return {}
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
        setBuffer(
          new LazyList([event], SourceEventView.decode, SourceEventView.encode)
        )
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
    $currentPageURL,
    $elapsed,
    $latestControlFrame,
    $playbackState,
    $snapshot,

    // Accessors
    getActiveIndex,
    getBuffer,
    getCurrentPageURL,
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
