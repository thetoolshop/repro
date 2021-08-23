import { Observable } from 'rxjs'
import { SyntheticId } from './common'
import { Interaction } from './interaction'
import { Patch, VTree } from './vdom'

export enum SourceEventType {
  DOMPatch = 'dom-patch',
  DOMSnapshot = 'dom-snapshot',
  Interaction = 'interaction',
  CloseRecording = 'close-recording',
}

interface BaseEvent {
  time: number
}

export interface DOMSnapshotEvent extends BaseEvent {
  type: SourceEventType.DOMSnapshot
  data: VTree
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
  | DOMPatchEvent
  | DOMSnapshotEvent
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
