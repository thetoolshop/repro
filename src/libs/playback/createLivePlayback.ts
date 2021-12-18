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
    ControlFrame.Play
  )
  const [$playbackState, getPlaybackState] = createAtom(PlaybackState.Playing)
  const [$snapshot, getSnapshot, setSnapshot] =
    createAtom<Snapshot>(EMPTY_SNAPSHOT)

  function getDuration() {
    return Infinity
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

  return {
    $activeIndex,
    $buffer,
    $elapsed,
    $latestControlFrame,
    $playbackState,
    $snapshot,

    getActiveIndex,
    getBuffer,
    getDuration,
    getElapsed,
    getLatestControlFrame,
    getPlaybackState,
    getSnapshot,

    play,
    pause,
    seekToEvent,
    seekToTime,

    open,
    close,
  }
}
