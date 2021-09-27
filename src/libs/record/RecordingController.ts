import { nanoid } from 'nanoid'
import { mergeRight } from 'ramda'
import { Stats } from '@/libs/stats'
import { Interaction } from '@/types/interaction'
import { DOMPatchEvent, DOMSnapshotEvent, InteractionEvent, Recording, SourceEventType } from '@/types/recording'
import { Patch, PatchType, VTree } from '@/types/vdom'
import { applyVTreePatch } from '@/utils/vdom'
import { buildVTreeSnapshot, observeDOMPatches } from './dom'
import { observeInteractions } from './interaction'
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

  constructor(doc: Document, options: Partial<RecordingOptions> = defaultOptions) {
    this.document = doc
    this.options = mergeRight(defaultOptions, options)
  }

  public start() {
    if (this.isStarted()) {
      return
    }

    this.timeOrigin = performance.now()
    this.latestVTree = buildVTreeSnapshot(this.document, this.options)

    this.started = true
    this.recording = createEmptyRecording()
    this.recording.events.push(this.createSnapshotEvent(0))
    this.recording.snapshotIndex.push(0)

    if (this.options.types.has('dom')) {
      this.createDOMObserver()
    }

    if (this.options.types.has('interaction')) {
      this.createInteractionObserver()
    }

    if (this.options.types.has('network')) {
      this.createNetworkObserver()
    }

    if (this.options.types.has('performance')) {
      this.createPerformanceObserver()
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
      data: this.latestVTree,
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

  private createInteractionEvent(interaction: Interaction): InteractionEvent {
    if (!this.isStarted()) {
      throw new Error('RecordingError: recording has not been started')
    }

    return {
      type: SourceEventType.Interaction,
      data: interaction,
      time: performance.now() - this.timeOrigin,
    }
  }

  private createDOMObserver() {
    if (this.latestVTree === null) {
      throw new Error('RecordingError: VTree has not been initialized')
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
        Stats.emit('DOM events between snapshots', counters)
        const index = this.recording.events.length
        this.recording.events.push(this.createSnapshotEvent())
        this.recording.snapshotIndex.push(index)
        counters = resetCounters()
      })
    )

    this.observers.push(
      observeDOMPatches(this.document, this.latestVTree, this.options, patch => {
        if (this.latestVTree === null) {
          throw new Error('RecordingError: VTree has not been initialized')
        }

        this.latestVTree = applyVTreePatch(this.latestVTree, patch)
        this.recording.events.push(this.createPatchEvent(patch))
        counters[patch.type] += 1
      })
    )
  }

  private createInteractionObserver() {
    this.observers.push(
      observeInteractions(this.document, this.options, interaction => {
        this.recording.events.push(this.createInteractionEvent(interaction))
      })
    )
  }

  private createNetworkObserver() {
    /*
    this.observers.push(
      observeNetworkEvents(event => {
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
      observePerformanceEvents(event => {
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
