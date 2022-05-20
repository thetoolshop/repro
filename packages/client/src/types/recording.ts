import { SyntheticId } from './common'
import { Interaction, InteractionSnapshot } from './interaction'
import { NetworkMessage, NetworkSnapshot } from './network'
import { Patch, VTree } from './vdom'
import { ArrayBufferBackedList } from '@/utils/lang'
import { ConsoleMessage, ConsoleSnapshot } from './console'

export enum SourceEventType {
  Snapshot = 0,
  DOMPatch = 10,
  Interaction = 20,
  Network = 30,
  Console = 40,
  CloseRecording = 99,
}

interface BaseEvent {
  time: number
}

export interface Snapshot {
  dom: VTree | null
  interaction?: InteractionSnapshot
  network?: NetworkSnapshot
  console?: ConsoleSnapshot
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

export interface NetworkEvent extends BaseEvent {
  type: SourceEventType.Network
  data: NetworkMessage
}

export interface ConsoleEvent extends BaseEvent {
  type: SourceEventType.Console
  data: ConsoleMessage
}

export interface CloseRecordingEvent extends BaseEvent {
  type: SourceEventType.CloseRecording
}

export type SourceEvent =
  | SnapshotEvent
  | DOMPatchEvent
  | InteractionEvent
  | NetworkEvent
  | ConsoleEvent
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
