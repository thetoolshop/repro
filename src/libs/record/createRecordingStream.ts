import { BufferReader } from 'arraybuffer-utils'
import { nanoid } from 'nanoid'
import { SyntheticId } from '@/types/common'
import { Interaction, InteractionType, PointerState } from '@/types/interaction'
import {
  DOMPatchEvent,
  InteractionEvent,
  Recording,
  Snapshot,
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
} from '@/types/recording'
import { Patch, VNode } from '@/types/vdom'
import { isZeroPoint } from '@/utils/interaction'
import { copyObjectDeep } from '@/utils/lang'
import { applyEventToSnapshot } from '@/utils/source'
import { applyVTreePatch, getNodeId } from '@/utils/vdom'
import { LITTLE_ENDIAN } from '../codecs/common'
import { decodeEvent, encodeEvent, readEventTime } from '../codecs/event'
import { Stats } from '../diagnostics'
import { createBuffer, Unsubscribe } from './buffer-utils'
import { createDOMObserver, createDOMTreeWalker, createDOMVisitor } from './dom'
import { createInteractionObserver, createScrollVisitor } from './interaction'
import { observePeriodic } from './periodic'
import { ObserverLike, RecordingOptions } from './types'

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

function createEmptySnapshot(): Snapshot {
  return {
    dom: null,
  }
}

export function createEmptyRecording(): Recording {
  return {
    id: nanoid(11),
    duration: 0,
    events: [],
    snapshotIndex: [],
  }
}

export interface RecordingStream {
  start(): void
  stop(): void
  peek(nodeId: SyntheticId): VNode | null
  slice(): Recording
}

export const EMPTY_RECORDING_STREAM: RecordingStream = {
  start: () => undefined,
  stop: () => undefined,
  peek: () => null,
  slice: createEmptyRecording,
}

export function createRecordingStream(
  doc: Document,
  customOptions: Partial<RecordingOptions>
): RecordingStream {
  const options: RecordingOptions = {
    ...defaultOptions,
    ...customOptions,
  }

  let started = false

  const observers: Array<ObserverLike> = []
  const buffer = createBuffer<ArrayBuffer>(MAX_BUFFER_SIZE_BYTES)
  let subscription: Unsubscribe | null = null

  const leadingSnapshot = createEmptySnapshot()
  const trailingSnapshot = createEmptySnapshot()

  const domTreeWalker = createDOMTreeWalker({
    ignoredNodes: options.ignoredNodes,
    ignoredSelectors: options.ignoredSelectors,
  })

  registerSnapshotObserver()

  if (options.types.has('dom')) {
    registerDOMVisitor()
    registerDOMObserver()
  }

  if (options.types.has('interaction')) {
    registerScrollVisitor()
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

    trailingSnapshot.dom = null

    if (options.types.has('interaction')) {
      trailingSnapshot.interaction = {
        pointer: [0, 0],
        pointerState: PointerState.Up,
        scroll: {},
        viewport: [0, 0],
      }
    }

    const start = performance.now()
    domTreeWalker(doc)
    Stats.value(
      'RecordingStream: build VTree snapshot',
      performance.now() - start
    )

    const trailingVTree = trailingSnapshot.dom

    if (!trailingVTree) {
      throw new Error('RecordingStream: VTree is not initialized')
    }

    subscribeToBuffer()

    for (const observer of observers) {
      observer.observe(doc, trailingVTree)
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

  function slice(): Recording {
    const recording = createEmptyRecording()
    const events = buffer.copy()

    events.sort((a, b) => {
      return readEventTime(a) - readEventTime(b)
    })

    return recording
  }

  function peek(nodeId: SyntheticId): VNode | null {
    const trailingVTree = trailingSnapshot.dom

    if (!trailingVTree) {
      throw new Error('RecordingStream; VTree is not initialized')
    }

    return trailingVTree.nodes[nodeId] || null
  }

  function addEvent(event: SourceEvent) {
    buffer.push(encodeEvent(event))
  }

  function createSnapshotEvent(at?: number): SnapshotEvent {
    return {
      time: at ?? performance.now(),
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
            'RecordingStream: trailing VTree has not been created'
          )
        }

        applyVTreePatch(trailingVTree, patch)
        addEvent(createPatchEvent(patch))
      })
    )
  }

  function registerDOMVisitor() {
    const rootId = getNodeId(doc)
    const domVisitor = createDOMVisitor()

    domVisitor.subscribe(vtree => {
      if (vtree.rootId === rootId) {
        trailingSnapshot.dom = vtree
      }
    })

    domTreeWalker.acceptDOMVisitor(domVisitor)
  }

  function createInteractionEvent(
    interaction: Interaction,
    transposition: number,
    at?: number
  ): InteractionEvent {
    return {
      time: at ?? performance.now() - transposition,
      type: SourceEventType.Interaction,
      data: interaction,
    }
  }

  function registerInteractionObserver() {
    observers.push(
      createInteractionObserver(
        options,
        (interaction, transposition = 0, at) => {
          const trailingInteraction = trailingSnapshot.interaction

          if (!trailingInteraction) {
            throw new Error(
              'RecordingStream: trailing interaction snapshot has not been created'
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

          addEvent(createInteractionEvent(interaction, transposition, at))
        }
      )
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

  function registerNetworkObserver() {}
  function registerPerformanceObserver() {}

  function subscribeToBuffer() {
    subscription = buffer.onEvict(evicted => {
      for (const evictee of evicted) {
        const reader = new BufferReader(evictee, 0, LITTLE_ENDIAN)
        const event = decodeEvent(reader)

        if (event.type === SourceEventType.Snapshot) {
          Object.assign(leadingSnapshot, event.data)
          continue
        }

        if (leadingSnapshot) {
          applyEventToSnapshot(leadingSnapshot, event, event.time)
        }
      }
    })
  }

  function unsubscribeFromBuffer() {
    if (subscription) {
      subscription()
      subscription = null
    }
  }

  return {
    start,
    stop,
    peek,
    slice,
  }
}
