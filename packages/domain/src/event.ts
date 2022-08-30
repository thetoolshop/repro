import { Interaction, InteractionView } from './interaction'
import { Snapshot, SnapshotView } from './snapshot'
import { DOMPatchView, Patch } from './vdom'
import { NetworkMessage, NetworkMessageView } from './network'
import { ConsoleMessage, ConsoleMessageView } from './console'
import {
  AnyDescriptor,
  createView,
  StructDescriptor,
  UINT32,
  UINT8,
  UnionDescriptor,
} from '@repro/typed-binary-encoder'

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

function createSourceEventView<T extends SourceEvent>(
  descriptor: AnyDescriptor
) {
  return createView<T, StructDescriptor>({
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['time', UINT32],
      ['data', descriptor],
    ],
  })
}

export const SnapshotEventView = createSourceEventView(SnapshotView.descriptor)

export const DOMPatchEventView = createSourceEventView<DOMPatchEvent>(
  DOMPatchView.descriptor
)

export const InteractionEventView = createSourceEventView<InteractionEvent>(
  InteractionView.descriptor
)

export const NetworkEventView = createSourceEventView<NetworkEvent>(
  NetworkMessageView.descriptor
)

export const ConsoleEventView = createSourceEventView<ConsoleEvent>(
  ConsoleMessageView.descriptor
)

export const CloseRecordingEventView = createView<
  CloseRecordingEvent,
  StructDescriptor
>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['time', UINT32],
  ],
})

export const SourceEventView = createView<SourceEvent, UnionDescriptor>({
  type: 'union',
  tagField: 'type',
  descriptors: {
    [SourceEventType.Snapshot]: SnapshotEventView.descriptor,
    [SourceEventType.DOMPatch]: DOMPatchEventView.descriptor,
    [SourceEventType.Interaction]: InteractionEventView.descriptor,
    [SourceEventType.Network]: NetworkEventView.descriptor,
    [SourceEventType.Console]: ConsoleEventView.descriptor,
    [SourceEventType.CloseRecording]: CloseRecordingEventView.descriptor,
  },
})
