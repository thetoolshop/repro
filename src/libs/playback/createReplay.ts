import { animationFrames, connectable, NEVER, Subscription } from 'rxjs'
import { map, pairwise, switchMap } from 'rxjs/operators'
import { Stats } from '@/libs/diagnostics'
import { Immutable } from '@/types/extensions'
import {
  InteractionType,
  Point,
  PointerState,
  ScrollMap,
} from '@/types/interaction'
import {
  Recording,
  Sample,
  Snapshot,
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
} from '@/types/recording'
import { copyArray, copyObjectDeep } from '@/utils/lang'
import {
  applyEventToSnapshot,
  interpolatePointFromSample,
  isSample,
} from '@/utils/source'
import { Atom, createAtom } from '@/utils/state'

/**
 * TARGET IMPLEMENTATION:
 *
 * const ReplayContext = React.createContext<Replay>()
 *
 * const ReplayProvider = ({ children, value }) => {
 *   useEffect(() => {
 *     return () => replay.close()
 *   }, [replay])
 *
 *   return children
 * }
 *
 * Replay provider starts/stops replay instance with lifecycle
 * <ReplayProvider value={replay}>
 *
 * function useReplay() {
 *   return useContext(ReplayContext)
 * }
 *
 * function useElapsed() {
 *   const replay = useReplay()
 *   return useAtomValue(replay.$elapsed)
 * }
 */

export enum PlaybackState {
  Playing,
  Paused,
  Done,
}

export interface Replay {
  // Atoms
  readonly $activeIndex: Atom<number>
  readonly $buffer: Atom<Array<SourceEvent>>
  readonly $elapsed: Atom<number>
  readonly $playbackState: Atom<PlaybackState>
  readonly $pointer: Atom<Point>
  readonly $pointerState: Atom<PointerState>
  readonly $scrollMap: Atom<ScrollMap>
  readonly $snapshot: Atom<Snapshot>
  readonly $viewport: Atom<Point>

  // Accessors
  getActiveIndex(): number
  getBuffer(): Array<SourceEvent>
  getDuration(): number
  getElapsed(): number
  getPlaybackState(): PlaybackState
  getPointer(): Point
  getPointerState(): PointerState
  getScrollMap(): ScrollMap
  getSnapshot(): Snapshot
  getViewport(): Point

  // Services
  play(): void
  pause(): void
  seekToEvent(index: number): void
  seekToTime(time: number): void

  // Lifecycle
  open(): void
  close(): void
}

const ZERO_POINT: Point = [0, 0]

const EMPTY_SNAPSHOT: Snapshot = {
  dom: null,
}

const EMPTY_BUFFER: Array<SourceEvent> = []

const EMPTY_SCROLL_MAP: ScrollMap = {}

export const EMPTY_REPLAY = createReplay({
  id: '',
  duration: 0,
  events: [],
  snapshotIndex: [],
})

export function createReplay(recording: Recording): Replay {
  const subscription = new Subscription()

  const [$activeIndex, getActiveIndex, setActveIndex] = createAtom(-1)
  const [$buffer, getBuffer, setBuffer] = createAtom<Array<SourceEvent>>([])
  const [$elapsed, getElapsed, setElapsed] = createAtom(0)
  const [$playbackState, getPlaybackState, setPlaybackState] = createAtom(
    PlaybackState.Paused
  )
  const [$snapshot, getSnapshot, setSnapshot] =
    createAtom<Snapshot>(EMPTY_SNAPSHOT)

  // Interaction projections
  const [$pointer, getPointer, setPointer] = createAtom(ZERO_POINT)
  const [$pointerState, getPointerState, setPointerState] = createAtom(
    PointerState.Up
  )
  const [$scrollMap, getScrollMap, setScrollMap] =
    createAtom<ScrollMap>(EMPTY_SCROLL_MAP)
  const [$viewport, getViewport, setViewport] = createAtom(ZERO_POINT)

  function loadEvents() {
    return copyArray(recording.events)
  }

  function partitionEvents(
    events: Immutable<Array<SourceEvent>>,
    shouldPartition: (event: SourceEvent, index: number) => boolean,
    isUnresolvedSample: (sample: Sample<any>, time: number) => boolean
  ) {
    const eventsBefore: Array<SourceEvent> = []
    const eventsAfter = copyArray(events as Array<SourceEvent>)
    const unresolvedSampleEvents: Array<SourceEvent> = []

    let event: SourceEvent | undefined
    let i = 0

    while ((event = eventsAfter[0])) {
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

  function updateInteractionStatesFromSnapshot(snapshot: Snapshot) {
    const data = snapshot.interaction
    setPointer(data?.pointer ?? ZERO_POINT)
    setPointerState(data?.pointerState ?? PointerState.Up)
    setScrollMap(data?.scroll ?? EMPTY_SCROLL_MAP)
    setViewport(data?.viewport ?? ZERO_POINT)
  }

  let queuedEvents: Array<SourceEvent> = loadEvents()

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
      // TODO: investigate why `withLatestFrom` returns a stale value
      const elapsed = getElapsed()

      for (const event of events) {
        switch (event.type) {
          case SourceEventType.Snapshot:
            updateInteractionStatesFromSnapshot(event.data)
            break

          case SourceEventType.Interaction:
            switch (event.data.type) {
              case InteractionType.PointerMove:
                setPointer(
                  interpolatePointFromSample(event.data, event.time, elapsed)
                )
                break

              case InteractionType.PointerDown:
                setPointer(event.data.at)
                setPointerState(PointerState.Down)
                break

              case InteractionType.PointerUp:
                setPointer(event.data.at)
                setPointerState(PointerState.Up)
                break

              case InteractionType.ViewportResize:
                setViewport(
                  interpolatePointFromSample(event.data, event.time, elapsed)
                )
                break

              case InteractionType.Scroll:
                const target = event.data.target
                const scroll = interpolatePointFromSample(
                  event.data,
                  event.time,
                  elapsed
                )

                setScrollMap(scrollMap => ({
                  ...scrollMap,
                  [target]: scroll,
                }))

                break
            }
            break
        }
      }
    })
  )

  function getDuration() {
    return recording.duration
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

    const targetEvent = queuedEvents[nextIndex]

    if (!targetEvent) {
      throw new Error(`Replay: could not find event at index ${nextIndex}`)
    }

    let snapshot: Snapshot | null = null

    for (const index of recording.snapshotIndex) {
      if (index <= nextIndex) {
        snapshot = (allEvents[index] as SnapshotEvent).data
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
      snapshot = copyObjectDeep(snapshot)

      for (const event of before) {
        applyEventToSnapshot(snapshot, event, targetEvent.time)
      }

      updateInteractionStatesFromSnapshot(snapshot)
    }

    setSnapshot(snapshot || EMPTY_SNAPSHOT)
    setActveIndex(before.length - 1)
    setElapsed(targetEvent.time)

    Stats.value('Replay: seek to event', performance.now() - start)
  }

  function seekToTime(elapsed: number) {
    const start = performance.now()

    setBuffer(EMPTY_BUFFER)
    const allEvents = loadEvents()
    queuedEvents = allEvents

    let snapshot: Snapshot | null = null

    for (const index of recording.snapshotIndex) {
      const event = allEvents[index] as SnapshotEvent

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
      snapshot = copyObjectDeep(snapshot)

      for (const event of before) {
        applyEventToSnapshot(snapshot, event, elapsed)
      }

      updateInteractionStatesFromSnapshot(snapshot)
    }

    setSnapshot(snapshot || EMPTY_SNAPSHOT)
    setActveIndex(before.length - 1)
    setElapsed(elapsed)

    Stats.value('Replay: seek to time', performance.now() - start)
  }

  function open() {
    subscription.add(eventLoop.connect())

    seekToTime(0)
  }

  function close() {
    subscription.unsubscribe()
  }

  return {
    // Read-only atoms
    $activeIndex,
    $buffer,
    $elapsed,
    $playbackState,
    $pointer,
    $pointerState,
    $scrollMap,
    $snapshot,
    $viewport,

    // Accessors
    getActiveIndex,
    getBuffer,
    getDuration,
    getElapsed,
    getPlaybackState,
    getPointer,
    getPointerState,
    getScrollMap,
    getSnapshot,
    getViewport,

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
