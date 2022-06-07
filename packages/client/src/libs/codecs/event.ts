import {
  CloseRecordingEvent,
  ConsoleEvent,
  DOMPatchEvent,
  InteractionEvent,
  NetworkEvent,
  SourceEvent,
  SourceEventType,
} from '@/types/recording'
import { InteractionView } from './interaction'
import { SnapshotView } from './snapshot'
import { DOMPatchView } from './vdom'
import { NetworkMessageView } from './network'
import { ConsoleMessageView } from './console'
import {
  AnyDescriptor,
  createView,
  StructDescriptor,
  UINT32,
  UINT8,
  UnionDescriptor,
} from '@/utils/encoding'

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
