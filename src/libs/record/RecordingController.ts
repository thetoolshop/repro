import { nanoid } from 'nanoid'
import { Stats } from '@/libs/diagnostics'
import { SyntheticId } from '@/types/common'
import {
  Interaction,
  InteractionType,
  Point,
  PointerState,
} from '@/types/interaction'
import {
  DOMPatchEvent,
  SnapshotEvent,
  InteractionEvent,
  Recording,
  SourceEventType,
  SourceEvent,
  Snapshot,
} from '@/types/recording'
import { Patch, VTree } from '@/types/vdom'
import { isZeroPoint } from '@/utils/interaction'
import { copyObjectDeep } from '@/utils/lang'
import { applyEventToSnapshot } from '@/utils/source'
import { applyVTreePatch, getNodeId } from '@/utils/vdom'
import { approxByteLength, createBuffer, Unsubscribe } from './buffer-utils'
import {
  DOMTreeWalker,
  createDOMTreeWalker,
  createDOMObserver,
  createDOMVisitor,
} from './dom'
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

export class RecordingController {
  public static EMPTY = createEmptyRecording()
  public recording = RecordingController.EMPTY

  private document: Document
  private options: RecordingOptions

  private started = false
  private buffer = createBuffer<SourceEvent>(10e6)
  private bufferSubscription: Unsubscribe | null = null
  private observers: Array<ObserverLike> = []
  private timeOrigin = 0
  private walkDOMTree: DOMTreeWalker | null = null

  // Snapshot entries
  // TODO: create single property to encapsulate snapshot state
  private leadingSnapshot: Snapshot | null = null
  private latestVTree: VTree | null = null
  private pointer: Point = [0, 0]
  private pointerState = PointerState.Up
  private scrollMap: Record<SyntheticId, Point> = {}
  private viewport: Point = [0, 0]

  constructor(
    doc: Document,
    options: Partial<RecordingOptions> = defaultOptions
  ) {
    this.document = doc
    this.options = {
      ...defaultOptions,
      ...options,
    }
  }

  public start() {
    if (this.isStarted()) {
      return
    }

    this.timeOrigin = performance.now()

    this.started = true
    this.buffer.clear()
    this.recording = createEmptyRecording()

    // Reset snapshot state
    this.latestVTree = null
    this.pointer = [0, 0]
    this.pointerState = PointerState.Up
    this.scrollMap = {}
    this.viewport = [0, 0]

    this.walkDOMTree = createDOMTreeWalker({
      ignoredNodes: this.options.ignoredNodes,
      ignoredSelectors: this.options.ignoredSelectors,
    })

    this.createSnapshotObserver()

    if (this.options.types.has('dom')) {
      const rootId = getNodeId(this.document)
      const domVisitor = createDOMVisitor()
      domVisitor.subscribe(vtree => {
        if (vtree.rootId === rootId) {
          this.latestVTree = vtree
        }
      })

      this.walkDOMTree.acceptDOMVisitor(domVisitor)
      this.createDOMObserver()
    }

    if (this.options.types.has('interaction')) {
      const scrollVisitor = createScrollVisitor()
      scrollVisitor.subscribe(scrollMap => {
        for (const [nodeId, point] of Object.entries(scrollMap)) {
          // If element does not have previous recorded scroll position
          // and new scroll position is [0, 0], omit this. Playback
          // will default to [0, 0].
          if (!this.scrollMap.hasOwnProperty(nodeId) && isZeroPoint(point)) {
            continue
          }

          this.scrollMap[nodeId] = point
        }
      })

      this.walkDOMTree.accept(scrollVisitor)
      this.createInteractionObserver()
    }

    if (this.options.types.has('network')) {
      this.createNetworkObserver()
    }

    if (this.options.types.has('performance')) {
      this.createPerformanceObserver()
    }

    const start = performance.now()
    this.walkDOMTree(this.document)
    Stats.value('DOM: build snapshot', performance.now() - start)

    // TODO: VTree should not be required where not recording DOM
    if (this.latestVTree === null) {
      throw new Error('RecordingError: VTree is not initialized')
    }

    this.subscribeToBuffer()

    const initialSnapshotEvent = this.createSnapshotEvent(0)
    this.addEvent(initialSnapshotEvent)
    this.leadingSnapshot = initialSnapshotEvent.data

    for (const observer of this.observers) {
      observer.observe(this.document, this.latestVTree)
    }
  }

  public stop() {
    let observer: ObserverLike | undefined

    while ((observer = this.observers.shift())) {
      observer.disconnect()
    }

    this.started = false

    const time = performance.now() - this.timeOrigin

    this.addEvent({
      type: SourceEventType.CloseRecording,
      time,
    })

    let events = this.buffer.copy()
    events.sort((a, b) => a.time - b.time)

    const timeOffset = events[0]?.time ?? 0
    this.recording.duration = time - timeOffset

    events = events.map(event => ({
      ...event,
      time: event.time - timeOffset,
    }))

    if (!this.leadingSnapshot) {
      throw new Error('Recording: cannot prepend leading snapshot')
    }

    events = [
      {
        type: SourceEventType.Snapshot,
        data: copyObjectDeep(this.leadingSnapshot),
        time: 0,
      },
      ...events,
    ]

    this.recording.events = events
    this.createSnapshotIndex()

    Stats.value('Recording size (bytes)', () => {
      return approxByteLength(this.recording)
    })

    this.unsubscribeFromBuffer()
    this.buffer.clear()
  }

  public isStarted() {
    return this.started === true
  }

  private subscribeToBuffer() {
    this.bufferSubscription = this.buffer.onEvict(evicted => {
      for (const evictedEvent of evicted) {
        if (evictedEvent.type === SourceEventType.Snapshot) {
          this.leadingSnapshot = evictedEvent.data
          continue
        }

        if (this.leadingSnapshot) {
          applyEventToSnapshot(
            this.leadingSnapshot,
            evictedEvent,
            evictedEvent.time
          )
        }
      }
    })
  }

  private unsubscribeFromBuffer() {
    if (this.bufferSubscription) {
      this.bufferSubscription()
    }
  }

  private addEvent(event: SourceEvent) {
    this.buffer.push(event)
  }

  private createSnapshotIndex() {
    const start = performance.now()
    const index: Array<number> = []

    for (let i = 0, len = this.recording.events.length; i < len; i++) {
      const event = this.recording.events[i]

      if (event && event.type === SourceEventType.Snapshot) {
        index.push(i)
      }
    }

    this.recording.snapshotIndex = index
    Stats.value('Indexing (ms)', performance.now() - start)
  }

  private createSnapshotEvent(at?: number): SnapshotEvent {
    if (!this.isStarted()) {
      throw new Error('RecordingError: recording has not been started')
    }

    const data: SnapshotEvent['data'] = {
      dom: null,
    }

    if (this.options.types.has('dom')) {
      if (this.latestVTree === null) {
        throw new Error('RecordingError: VTree has not been initialized')
      }

      data.dom = copyObjectDeep(this.latestVTree)
    }

    if (this.options.types.has('interaction')) {
      data.interaction = {
        pointer: this.pointer,
        pointerState: this.pointerState,
        scroll: copyObjectDeep(this.scrollMap),
        viewport: this.viewport,
      }
    }

    return {
      time: at ?? performance.now() - this.timeOrigin,
      type: SourceEventType.Snapshot,
      data,
    }
  }

  private createPatchEvent(patch: Patch): DOMPatchEvent {
    if (!this.isStarted()) {
      throw new Error('RecordingError: recording has not been started')
    }

    return {
      type: SourceEventType.DOMPatch,
      data: patch,
      time: performance.now() - this.timeOrigin,
    }
  }

  private createInteractionEvent(
    interaction: Interaction,
    transposition: number,
    at?: number
  ): InteractionEvent {
    if (!this.isStarted()) {
      throw new Error('RecordingError: recording has not been started')
    }

    return {
      type: SourceEventType.Interaction,
      data: interaction,
      time: at ?? performance.now() - this.timeOrigin - transposition,
    }
  }

  private createSnapshotObserver() {
    this.observers.push(
      observePeriodic(this.options.snapshotInterval, () => {
        this.addEvent(this.createSnapshotEvent())
      })
    )
  }

  private createDOMObserver() {
    if (this.walkDOMTree === null) {
      throw new Error('RecordingError: cannot find DOMTreeWalker')
    }

    this.observers.push(
      createDOMObserver(this.walkDOMTree, this.options, patch => {
        if (this.latestVTree === null) {
          throw new Error('RecordingError: VTree has not been initialized')
        }

        applyVTreePatch(this.latestVTree, patch)
        this.addEvent(this.createPatchEvent(patch))
      })
    )
  }

  private createInteractionObserver() {
    this.observers.push(
      createInteractionObserver(
        this.options,
        (interaction, transposition = 0, at) => {
          switch (interaction.type) {
            case InteractionType.PointerMove:
              this.pointer = interaction.to
              break

            case InteractionType.PointerDown:
              this.pointer = interaction.at
              this.pointerState = PointerState.Down
              break

            case InteractionType.PointerUp:
              this.pointer = interaction.at
              this.pointerState = PointerState.Up
              break

            case InteractionType.Scroll:
              this.scrollMap[interaction.type] = interaction.to
              break

            case InteractionType.ViewportResize:
              this.viewport = interaction.to
              break
          }

          this.addEvent(
            this.createInteractionEvent(interaction, transposition, at)
          )
        }
      )
    )
  }

  private createNetworkObserver() {
    /*
    this.observers.push(
      createNetworkObserver(event => {
        this.subscribers.forEach(subscriber => {
          subscriber(event)
        })
      })
    )
    /**/
  }

  private createPerformanceObserver() {
    /*
    this.observers.push(
      createPerformanceObserver(event => {
        this.subscribers.forEach(subscriber => {
          subscriber(event)
        })
      })
    )
    /**/
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
