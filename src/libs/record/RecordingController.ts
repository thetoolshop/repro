import { nanoid } from 'nanoid'
import { Stats } from '@/libs/diagnostics'
import { Interaction } from '@/types/interaction'
import { DOMPatchEvent, DOMSnapshotEvent, InteractionEvent, Recording, SourceEventType } from '@/types/recording'
import { Patch, PatchType, VTree } from '@/types/vdom'
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
  private latestVTree: VTree | null = null
  private walkDOMTree: DOMTreeWalker | null = null

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
      scrollVisitor.subscribe(() => {

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

    if (this.latestVTree === null) {
      throw new Error('RecordingError: VTree is not initialized')
    }

    this.recording.events.push(this.createSnapshotEvent(0))
    this.recording.snapshotIndex.push(0)

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

  private createSnapshotEvent(at?: number): DOMSnapshotEvent {
    if (!this.isStarted()) {
      throw new Error('RecordingError: recording has not been started')
    }

    if (this.latestVTree === null) {
      throw new Error('RecordingError: VTree has not been initialized')
    }

    return {
      type: SourceEventType.DOMSnapshot,
      data: copyObjectDeep(this.latestVTree),
      time: at ?? performance.now() - this.timeOrigin,
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

  private createDOMObserver() {
    if (this.walkDOMTree === null) {
      throw new Error('RecordingError: cannot find DOMTreeWalker')
    }

    function resetCounters(): Record<PatchType, number> {
      return {
        [PatchType.AddNodes]: 0,
        [PatchType.Attribute]: 0,
        [PatchType.RemoveNodes]: 0,
        [PatchType.Text]: 0,
      }
    }

    let counters = resetCounters()

    this.observers.push(
      observePeriodic(10000, () => {
        Stats.scalar('DOM events between snapshots (attribute)', counters[PatchType.Attribute])
        Stats.scalar('DOM events between snapshots (text)', counters[PatchType.Text])
        Stats.scalar('DOM events between snapshots (add-nodes)', counters[PatchType.AddNodes])
        Stats.scalar('DOM events between snapshots (remove-nodes)', counters[PatchType.RemoveNodes])

        const index = this.recording.events.length
        this.recording.events.push(this.createSnapshotEvent())
        this.recording.snapshotIndex.push(index)
        counters = resetCounters()
      })
    )

    this.observers.push(
      createDOMObserver(this.walkDOMTree, this.options, patch => {
        if (this.latestVTree === null) {
          throw new Error('RecordingError: VTree has not been initialized')
        }

        applyVTreePatch(this.latestVTree, patch)
        this.recording.events.push(this.createPatchEvent(patch))
        counters[patch.type] += 1
      })
    )
  }

  private createInteractionObserver() {
    this.observers.push(
      createInteractionObserver(this.options, (interaction, transposition = 0, at) => {
        this.recording.events.push(this.createInteractionEvent(interaction, transposition, at))
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
