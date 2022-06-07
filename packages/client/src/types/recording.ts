import { SyntheticId } from './common'
import { Interaction, InteractionSnapshot } from './interaction'
import { NetworkMessage } from './network'
import { Patch, VTree } from './vdom'
import { ConsoleMessage } from './console'

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

export enum RecordingMode {
  None = 0,
  Snapshot = 1,
  Live = 2,
  Replay = 3,
}

export interface Recording {
  codecVersion: number
  id: SyntheticId
  mode: RecordingMode
  duration: number
  events: Array<ArrayBuffer>
}
