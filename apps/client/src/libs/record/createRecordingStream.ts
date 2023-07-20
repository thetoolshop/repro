import {
  ConsoleEvent,
  ConsoleMessage,
  DOMPatchEvent,
  Interaction,
  InteractionEvent,
  InteractionSnapshot,
  InteractionType,
  NetworkEvent,
  NetworkMessage,
  Patch,
  PerformanceEntry,
  PerformanceEvent,
  PointerState,
  Snapshot,
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
  SourceEventView,
  SyntheticId,
  VNode,
} from '@repro/domain'
import { copyObjectDeep, LazyList } from '@repro/std'
import { copy as copyDataView } from '@repro/typed-binary-encoder'
import { applyVTreePatch, getNodeId } from '@repro/vdom-utils'
import {
  concat,
  defer,
  NEVER,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs'
import { isZeroPoint } from '~/utils/interaction'
import { ObserverLike } from '~/utils/observer'
import { applyEventToSnapshot, createEmptySnapshot } from '~/utils/source'
import { Stats } from '../diagnostics'
import { createBuffer, Unsubscribe } from './buffer-utils'
import { createConsoleObserver } from './console'
import {
  createDOMObserver,
  createDOMTreeWalker,
  createDOMVisitor,
  createIFrameVisitor,
} from './dom'
import { createInteractionObserver, createScrollVisitor } from './interaction'
import { createViewportVisitor } from './interaction/visitor'
import { createNetworkObserver } from './network'
import { createPerformanceObserver } from './performance'
import { observePeriodic } from './periodic'
import { RecordingOptions } from './types'

const defaultOptions: RecordingOptions = {
  types: new Set(['dom', 'interaction']),
  ignoredNodes: [],
  ignoredSelectors: [],
  snapshotInterval: 10000,
  eventSampling: {
    pointerMove: 50,
    resize: 200,
    scroll: 100,
  },
}

const MAX_EVENT_BUFFER_SIZE_BYTES = 32_000_000

export function createEmptyInteractionSnapshot(): InteractionSnapshot {
  return {
    pointer: [0, 0],
    pointerState: PointerState.Up,
    scroll: {},
    viewport: [0, 0],
  }
}

export interface RecordingStream {
  start(): void
  stop(): void
  isStarted(): boolean
  peek(nodeId: SyntheticId): VNode | null
  slice(): Promise<LazyList<SourceEvent>>
  snapshot(): Snapshot
  tail(signal: Subject<void>): Observable<SourceEvent>
}

interface BufferSubscriptions {
  onEvict: Unsubscribe | null
  onPush: Unsubscribe | null
}

export const EMPTY_RECORDING_STREAM: RecordingStream = {
  start: () => undefined,
  stop: () => undefined,
  isStarted: () => false,
  peek: () => null,
  slice: () => Promise.resolve(LazyList.Empty<SourceEvent>()),
  snapshot: () => createEmptySnapshot(),
  tail: () => NEVER,
}

export const InterruptSignal = new Subject<void>()
export function interrupt() {
  InterruptSignal.next()
}

export function createRecordingStream(
  rootDocument: Document,
  customOptions: Partial<RecordingOptions>
): RecordingStream {
  const options: RecordingOptions = {
    ...defaultOptions,
    ...customOptions,
  }

  let started = false

  const observers: Array<ObserverLike> = []
  const eventBuffer = createBuffer<DataView>(MAX_EVENT_BUFFER_SIZE_BYTES)

  const bufferSubscriptions: BufferSubscriptions = {
    onEvict: null,
    onPush: null,
  }

  let leadingSnapshot = createEmptySnapshot()
  let trailingSnapshot = createEmptySnapshot()
  let sourceDocuments = [rootDocument]

  const domTreeWalker = createDOMTreeWalker({
    ignoredNodes: options.ignoredNodes,
    ignoredSelectors: options.ignoredSelectors,
  })

  // TODO: investigate on-the-fly snapshotting
  registerSnapshotObserver()

  if (options.types.has('dom')) {
    registerDOMVisitor()
    registerIFrameVisitor()
    registerDOMObserver()
  }

  if (options.types.has('interaction')) {
    registerScrollVisitor()
    registerViewportVisitor()
    registerInteractionObserver()
  }

  if (options.types.has('network')) {
    registerNetworkObserver()
  }

  if (options.types.has('console')) {
    registerConsoleObserver()
  }

  if (options.types.has('performance')) {
    registerPerformanceObserver()
  }

  function start() {
    if (started) {
      return
    }

    started = true

    sourceDocuments = [rootDocument]
    trailingSnapshot = createEmptySnapshot()

    if (options.types.has('interaction')) {
      trailingSnapshot.interaction = createEmptyInteractionSnapshot()
    }

    Stats.time('RecordingStream#start: build VTree snapshot', () => {
      // TODO: collect iframes to observe nested documents
      domTreeWalker(rootDocument)
    })

    const trailingVTree = trailingSnapshot.dom

    if (!trailingVTree) {
      throw new Error('RecordingStream#start: VTree is not initialized')
    }

    leadingSnapshot = copyObjectDeep(trailingSnapshot)
    subscribeToBuffer()
    addEvent(createSnapshotEvent())

    for (const observer of observers) {
      for (const doc of sourceDocuments) {
        observer.observe(doc, trailingVTree)
      }
    }
  }

  function stop() {
    if (!started) {
      return
    }

    for (const observer of observers) {
      observer.disconnect()
    }

    unsubscribeFromBuffer()
    eventBuffer.clear()

    started = false
  }

  function isStarted() {
    return started
  }

  async function slice(): Promise<LazyList<SourceEvent>> {
    let events: Array<DataView> = []

    Stats.time('RecordingStream#slice: total', () => {
      Stats.time('RecordingStream#slice: deep copy event buffer', () => {
        events = eventBuffer.copy().map(copyDataView)
      })

      Stats.time('RecordingStream#slice: sort events by time', () => {
        events.sort((a, b) => {
          return SourceEventView.over(a).time - SourceEventView.over(b).time
        })
      })

      Stats.time('RecordingStream#slice: append trailing snapshot', () => {
        events.push(SourceEventView.encode(createSnapshotEvent()))
      })

      const firstEvent = events[0] && SourceEventView.over(events[0])
      const timeOffset = firstEvent ? firstEvent.time : 0

      Stats.value('RecordingStream#slice: time offset', timeOffset)

      Stats.time('RecordingStream#slice: offset event times', () => {
        for (const event of events) {
          const lens = SourceEventView.over(event)
          lens.time = lens.time - timeOffset
        }
      })

      // If first event is not a snapshot event (i.e. leading snapshot has been
      // evicted), prepend rolling leading snapshot.
      if (!firstEvent || firstEvent.type !== SourceEventType.Snapshot) {
        Stats.time('RecordingStream#slice: prepend leading snapshot', () => {
          events.unshift(
            SourceEventView.encode({
              time: 0,
              type: SourceEventType.Snapshot,
              data: leadingSnapshot,
            })
          )
        })
      }
    })

    return new LazyList(events, SourceEventView.decode, SourceEventView.encode)
  }

  function peek(nodeId: SyntheticId): VNode | null {
    const trailingVTree = trailingSnapshot.dom

    if (!trailingVTree) {
      throw new Error('RecordingStream#peek: VTree is not initialized')
    }

    return trailingVTree.nodes[nodeId] || null
  }

  function snapshot(): Snapshot {
    return copyObjectDeep(trailingSnapshot)
  }

  function tail(signal: Subject<void>): Observable<SourceEvent> {
    function observeSnapshot() {
      return defer(() => of(SourceEventView.from(createSnapshotEvent())))
    }

    return observeSnapshot().pipe(
      switchMap(snapshotEvent => {
        const timeOffset = snapshotEvent.time
        snapshotEvent.time -= timeOffset

        return concat(
          of(snapshotEvent),
          new Observable<SourceEvent>(observer => {
            const subscription = eventBuffer.onPush(data => {
              const event = SourceEventView.over(copyDataView(data))
              event.time -= timeOffset
              observer.next(event)
            })

            return () => {
              subscription()
            }
          }).pipe(takeUntil(signal))
        )
      })
    )
  }

  function addEvent(event: SourceEvent) {
    eventBuffer.push(SourceEventView.encode(event))
  }

  function createSnapshotEvent(): SnapshotEvent {
    return {
      time: performance.now(),
      type: SourceEventType.Snapshot,
      data: copyObjectDeep(trailingSnapshot),
    }
  }

  function registerSnapshotObserver() {
    observers.push(
      observePeriodic(options.snapshotInterval, () => {
        addEvent(createSnapshotEvent())
      })
    )
  }

  function createPatchEvent(patch: Patch): DOMPatchEvent {
    return {
      time: performance.now(),
      type: SourceEventType.DOMPatch,
      data: patch,
    }
  }

  function registerDOMObserver() {
    observers.push(
      createDOMObserver(domTreeWalker, options, patch => {
        const trailingVTree = trailingSnapshot.dom

        if (!trailingVTree) {
          throw new Error(
            'RecordingStream~registerDOMObserver: trailing VTree has not been created'
          )
        }

        applyVTreePatch(trailingVTree, patch)
        addEvent(createPatchEvent(patch))
      })
    )
  }

  function registerDOMVisitor() {
    const rootId = getNodeId(rootDocument)
    const domVisitor = createDOMVisitor()

    domVisitor.subscribe(vtree => {
      if (vtree.rootId === rootId) {
        trailingSnapshot.dom = vtree
      }
    })

    domTreeWalker.acceptDOMVisitor(domVisitor)
  }

  function registerIFrameVisitor() {
    const iframeVisitor = createIFrameVisitor()

    iframeVisitor.subscribe(contentDocuments => {
      sourceDocuments.push(...contentDocuments)

      if (started && trailingSnapshot.dom) {
        for (const observer of observers) {
          for (const doc of contentDocuments) {
            observer.observe(doc, trailingSnapshot.dom)
          }
        }
      }
    })

    domTreeWalker.accept(iframeVisitor)
  }

  function createInteractionEvent(
    interaction: Interaction,
    transposition: number
  ): InteractionEvent {
    return {
      time: performance.now() - transposition,
      type: SourceEventType.Interaction,
      data: interaction,
    }
  }

  function registerInteractionObserver() {
    observers.push(
      createInteractionObserver(options, (interaction, transposition = 0) => {
        const trailingInteraction = trailingSnapshot.interaction

        if (!trailingInteraction) {
          throw new Error(
            'RecordingStream~registerInteractionObserver: trailing interaction snapshot has not been created'
          )
        }

        switch (interaction.type) {
          case InteractionType.PointerMove:
            trailingInteraction.pointer = interaction.to
            break

          case InteractionType.PointerDown:
            trailingInteraction.pointer = interaction.at
            trailingInteraction.pointerState = PointerState.Down
            break

          case InteractionType.PointerUp:
            trailingInteraction.pointer = interaction.at
            trailingInteraction.pointerState = PointerState.Up
            break

          case InteractionType.Scroll:
            trailingInteraction.scroll[interaction.target] = interaction.to
            break

          case InteractionType.ViewportResize:
            trailingInteraction.viewport = interaction.to
            break

          case InteractionType.PageTransition:
            trailingInteraction.pageURL = interaction.to
            break
        }

        addEvent(createInteractionEvent(interaction, transposition))
      })
    )
  }

  // @ts-ignore
  function registerScrollVisitor() {
    const scrollVisitor = createScrollVisitor()

    scrollVisitor.subscribe(scroll => {
      const scrollSnapshot = trailingSnapshot.interaction?.scroll

      if (scrollSnapshot) {
        for (const [nodeId, point] of Object.entries(scroll)) {
          // If element does not have previous recorded scroll position
          // and new scroll position is [0, 0], omit this. Playback
          // will default to [0, 0].
          if (!scrollSnapshot.hasOwnProperty(nodeId) && isZeroPoint(point)) {
            continue
          }

          scrollSnapshot[nodeId] = point
        }
      }
    })

    domTreeWalker.accept(scrollVisitor)
  }

  function registerViewportVisitor() {
    const viewportVisitor = createViewportVisitor()

    viewportVisitor.subscribe(viewport => {
      if (trailingSnapshot.interaction) {
        trailingSnapshot.interaction.viewport = viewport
      }
    })

    domTreeWalker.accept(viewportVisitor)
  }

  function createNetworkEvent(message: NetworkMessage): NetworkEvent {
    return {
      type: SourceEventType.Network,
      time: performance.now(),
      data: message,
    }
  }

  function registerNetworkObserver() {
    observers.push(
      createNetworkObserver(message => {
        addEvent(createNetworkEvent(message))
      })
    )
  }

  function createConsoleEvent(message: ConsoleMessage): ConsoleEvent {
    return {
      type: SourceEventType.Console,
      time: performance.now(),
      data: message,
    }
  }

  function registerConsoleObserver() {
    observers.push(
      createConsoleObserver(message => {
        addEvent(createConsoleEvent(message))
      })
    )
  }

  function createPerformanceEvent(entry: PerformanceEntry): PerformanceEvent {
    return {
      type: SourceEventType.Performance,
      time: performance.now(),
      data: entry,
    }
  }

  function registerPerformanceObserver() {
    observers.push(
      createPerformanceObserver(entry => {
        addEvent(createPerformanceEvent(entry))
      })
    )
  }

  function subscribeToBuffer() {
    bufferSubscriptions.onEvict = eventBuffer.onEvict(evicted => {
      for (const evictee of evicted) {
        const event = SourceEventView.over(evictee)

        // We rebuild a snapshot from incremental events after
        // eviction, so snapshots on the buffer can be discarded
        if (event.type === SourceEventType.Snapshot) {
          continue
        }

        if (leadingSnapshot) {
          applyEventToSnapshot(leadingSnapshot, event, event.time)
        }

        // TODO: drop evicted console and network messages from snapshots
      }
    })
  }

  function unsubscribeFromBuffer() {
    if (bufferSubscriptions.onEvict) {
      bufferSubscriptions.onEvict()
      bufferSubscriptions.onEvict = null
    }
  }

  return {
    start,
    stop,
    isStarted,
    peek,
    slice,
    snapshot,
    tail,
  }
}
