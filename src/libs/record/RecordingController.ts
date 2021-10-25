import { nanoid } from 'nanoid'
import { Stats } from '@/libs/diagnostics'
import { SyntheticId } from '@/types/common'
import { Interaction, InteractionType, Point } from '@/types/interaction'
import { DOMPatchEvent, SnapshotEvent, InteractionEvent, Recording, SourceEventType } from '@/types/recording'
import { Patch, VTree } from '@/types/vdom'
import { isZeroPoint } from '@/utils/interaction'
import { copyObjectDeep } from '@/utils/lang'
import { applyVTreePatch, getNodeId } from '@/utils/vdom'
import { DOMTreeWalker, createDOMTreeWalker, createDOMObserver, createDOMVisitor } from './dom'
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
  private observers: Array<ObserverLike> = []
  private timeOrigin = 0
  private walkDOMTree: DOMTreeWalker | null = null

  // Snapshot entries
  // TODO: create single property to encapsulate snapshot state
  private latestVTree: VTree | null = null
  private scrollMap: Record<SyntheticId, Point> = {}

  constructor(doc: Document, options: Partial<RecordingOptions> = defaultOptions) {
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
    this.recording = createEmptyRecording()

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
          this.latestVTree = vtree;
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
    Stats.scalar('DOM: build snapshot', performance.now() - start)

    // TODO: VTree should not be required where not recording DOM
    if (this.latestVTree === null) {
      throw new Error('RecordingError: VTree is not initialized')
    }

    const index = this.recording.events.length
    this.recording.events.push(this.createSnapshotEvent(0))
    this.recording.snapshotIndex.push(index)

    for (const observer of this.observers) {
      observer.observe(this.document, this.latestVTree)
    }
  }

  public stop() {
    let observer: ObserverLike | undefined

    while (observer = this.observers.shift()) {
      observer.disconnect()
    }

    this.started = false

    const time = performance.now() - this.timeOrigin
    this.recording.duration = time

    this.recording.events.push({
      type: SourceEventType.CloseRecording,
      time,
    })

    this.recording.events.sort((a, b) => a.time - b.time)

    Stats.scalar('Recording size (bytes)', () => {
      return new TextEncoder()
        .encode(JSON.stringify(this.recording))
        .byteLength
    })
  }

  public isStarted() {
    return this.started === true
  }

  private createSnapshotEvent(at?: number): SnapshotEvent {
    if (!this.isStarted()) {
      throw new Error('RecordingError: recording has not been started')
    }

    const data: SnapshotEvent['data'] = {}

    if (this.options.types.has('dom')) {
      if (this.latestVTree === null) {
        throw new Error('RecordingError: VTree has not been initialized')
      }

      data.dom = copyObjectDeep(this.latestVTree)
    }

    if (this.options.types.has('interaction')) {
      data.interaction = {
        scroll: copyObjectDeep(this.scrollMap),
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

  private createInteractionEvent(interaction: Interaction, transposition: number, at?: number): InteractionEvent {
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
        const index = this.recording.events.length
        this.recording.events.push(this.createSnapshotEvent())
        this.recording.snapshotIndex.push(index)
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
        this.recording.events.push(this.createPatchEvent(patch))
      })
    )
  }

  private createInteractionObserver() {
    this.observers.push(
      createInteractionObserver(this.options, (interaction, transposition = 0, at) => {
        switch (interaction.type) {
          case InteractionType.Scroll:
            this.scrollMap[interaction.type] = interaction.to
            break
        }

        this.recording.events.push(
          this.createInteractionEvent(interaction, transposition, at)
        )
      })
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
