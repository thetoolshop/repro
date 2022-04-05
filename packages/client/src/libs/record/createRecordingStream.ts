import { BufferReader } from 'arraybuffer-utils'
import { SyntheticId } from '@/types/common'
import { Interaction, InteractionType, PointerState } from '@/types/interaction'
import {
  DOMPatchEvent,
  InteractionEvent,
  InteractionSnapshot,
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
} from '@/types/recording'
import { Patch, VNode } from '@/types/vdom'
import { isZeroPoint } from '@/utils/interaction'
import { ArrayBufferBackedList, copyObjectDeep } from '@/utils/lang'
import { ObserverLike } from '@/utils/observer'
import { applyEventToSnapshot, createEmptySnapshot } from '@/utils/source'
import { applyVTreePatch, getNodeId } from '@/utils/vdom'
import { copy as copyArrayBuffer, LITTLE_ENDIAN } from '../codecs/common'
import {
  decodeEvent,
  encodeEvent,
  readEventTime,
  readEventType,
  writeEventTimeOffset,
} from '../codecs/event'
import { Stats } from '../diagnostics'
import { createBuffer, Unsubscribe } from './buffer-utils'
import {
  createDOMObserver,
  createDOMTreeWalker,
  createDOMVisitor,
  createIFrameVisitor,
} from './dom'
import { createInteractionObserver, createScrollVisitor } from './interaction'
import { observePeriodic } from './periodic'
import { RecordingOptions } from './types'
import { concat, NEVER, Observable, of } from 'rxjs'
import { createViewportVisitor } from './interaction/visitor'

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

const MAX_BUFFER_SIZE_BYTES = 32_000_000

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
  slice(): Promise<ArrayBufferBackedList<SourceEvent>>
  tail(): Observable<SourceEvent>
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
  slice: () => Promise.resolve(EMPTY_EVENT_LIST),
  tail: () => NEVER,
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
  const buffer = createBuffer<ArrayBuffer>(MAX_BUFFER_SIZE_BYTES)

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
    // TODO: investigate performance
    // Reading scrollLeft/scrollTop triggers a reflow for each element.
    // registerScrollVisitor()
    registerViewportVisitor()
    registerInteractionObserver()
  }

  if (options.types.has('network')) {
    registerNetworkObserver()
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
    buffer.clear()

    started = false
  }

  function isStarted() {
    return started
  }

  async function slice(): Promise<ArrayBufferBackedList<SourceEvent>> {
    let events: Array<ArrayBuffer> = []

    Stats.time('RecordingStream#slice: total', () => {
      Stats.time('RecordingStream#slice: deep copy event buffer', () => {
        events = buffer.copy().map(copyArrayBuffer)
      })

      Stats.time('RecordingStream#slice: sort events by time', () => {
        events.sort((a, b) => {
          return readEventTime(a) - readEventTime(b)
        })
      })

      Stats.time('RecordingStream#slice: append trailing snapshot', () => {
        events.push(encodeEvent(createSnapshotEvent()))
      })

      const firstEvent = events[0]
      const timeOffset = firstEvent ? readEventTime(firstEvent) : 0

      Stats.value('RecordingStream#slice: time offset', timeOffset)

      Stats.time('RecordingStream#slice: offset event times', () => {
        for (const event of events) {
          writeEventTimeOffset(event, timeOffset)
        }
      })

      // If first event is not a snapshot event (i.e. leading snapshot has been
      // evicted), prepend rolling leading snapshot.
      if (
        !firstEvent ||
        readEventType(firstEvent) !== SourceEventType.Snapshot
      ) {
        Stats.time('RecordingStream#slice: prepend leading snapshot', () => {
          events.unshift(
            encodeEvent({
              time: 0,
              type: SourceEventType.Snapshot,
              data: leadingSnapshot,
            })
          )
        })
      }

      /**
      Stats.time('RecordingStream#slice: index snapshot events', () => {
        for (let i = 0, len = events.length; i < len; i++) {
          const event = events[i]

          if (event) {
            const type = readEventType(event)

            if (type === SourceEventType.Snapshot) {
              recording.snapshotIndex.push(i)
            }
          }
        }
      })
      /**/
    })

    return new ArrayBufferBackedList<SourceEvent>(
      events,
      eventReader,
      eventWriter
    )
  }

  function peek(nodeId: SyntheticId): VNode | null {
    const trailingVTree = trailingSnapshot.dom

    if (!trailingVTree) {
      throw new Error('RecordingStream#peek: VTree is not initialized')
    }

    return trailingVTree.nodes[nodeId] || null
  }

  function tail(): Observable<SourceEvent> {
    return concat(
      of(createSnapshotEvent()),
      new Observable<SourceEvent>(observer => {
        const subscription = buffer.onPush(data => {
          const reader = new BufferReader(data, 0, LITTLE_ENDIAN)
          observer.next(decodeEvent(reader))
        })

        return () => {
          subscription()
        }
      })
    )
  }

  function addEvent(event: SourceEvent) {
    buffer.push(encodeEvent(event))
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
        }

        addEvent(createInteractionEvent(interaction, transposition))
      })
    )
  }

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

  function registerNetworkObserver() {}
  function registerPerformanceObserver() {}

  function subscribeToBuffer() {
    bufferSubscriptions.onEvict = buffer.onEvict(evicted => {
      for (const evictee of evicted) {
        const type = readEventType(evictee)

        // We rebuild a snapshot from incremental events after
        // eviction, so snapshots on the buffer can be discarded
        if (type === SourceEventType.Snapshot) {
          continue
        }

        if (leadingSnapshot) {
          const reader = new BufferReader(evictee, 0, LITTLE_ENDIAN)
          const event = decodeEvent(reader)
          applyEventToSnapshot(leadingSnapshot, event, event.time)
        }
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
    tail,
  }
}
