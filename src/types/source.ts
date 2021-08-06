import { Patch, VTree } from './vdom'

export enum SourceEventType {
  DOMPatch = 'dom-patch',
  DOMSnapshot = 'dom-snapshot',
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

export interface CloseRecordingEvent extends BaseEvent {
  type: SourceEventType.CloseRecording
}

export type SourceEvent =
  | DOMPatchEvent
  | DOMSnapshotEvent
  | CloseRecordingEvent

export interface Metadata {
  duration: number
}

export interface Source {
  events(): Promise<Array<SourceEvent>>
  metadata(): Promise<Metadata>
}
