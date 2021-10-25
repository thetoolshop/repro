import { Observable } from 'rxjs'
import { SyntheticId } from './common'
import { Interaction, ScrollMap } from './interaction'
import { Patch, VTree } from './vdom'

export enum SourceEventType {
  Snapshot            = 0,
  DOMPatch            = 10,
  Interaction         = 20,
  CloseRecording      = 99,
}

interface BaseEvent {
  time: number
}

export interface SnapshotEvent extends BaseEvent {
  type: SourceEventType.Snapshot
  data: Partial<{
    dom: VTree
    interaction: {
      scroll: ScrollMap
    }
  }>
}

export interface DOMPatchEvent extends BaseEvent {
  type: SourceEventType.DOMPatch
  data: Patch
}

export interface InteractionEvent extends BaseEvent {
  type: SourceEventType.Interaction
  data: Interaction
}

export interface CloseRecordingEvent extends BaseEvent {
  type: SourceEventType.CloseRecording
}


export type SourceEvent =
  | SnapshotEvent
  | DOMPatchEvent
  | InteractionEvent
  | CloseRecordingEvent

export interface Recording {
  id: SyntheticId
  duration: number
  events: Array<SourceEvent>
  snapshotIndex: Array<number>
}

export interface Metadata {
  duration: number
}

export interface Source {
  events(): Observable<Array<SourceEvent>>
  metadata(): Observable<Metadata>
}
