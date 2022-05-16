import { SyntheticId } from './common'
import { Interaction, InteractionSnapshot } from './interaction'
import { NetworkSnapshot } from './network'
import { Patch, VTree } from './vdom'
import { ArrayBufferBackedList } from '@/utils/lang'

export enum SourceEventType {
  Snapshot = 0,
  DOMPatch = 10,
  Interaction = 20,
  CloseRecording = 99,
}

interface BaseEvent {
  time: number
}

export interface Snapshot {
  dom: VTree | null
  interaction?: InteractionSnapshot
  network?: NetworkSnapshot
}

export interface SnapshotEvent extends BaseEvent {
  type: SourceEventType.Snapshot
  data: Snapshot
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

export interface Sample<T> {
  from: T
  to: T
  duration: number
}

export interface Recording {
  codecVersion: number
  id: SyntheticId
  duration: number
  events: ArrayBufferBackedList<SourceEvent>
}
