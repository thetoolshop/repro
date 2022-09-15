import z, { ZodType, ZodTypeDef } from 'zod'
import { InteractionSchema, InteractionView } from './interaction'
import { SnapshotSchema, SnapshotView } from './snapshot'
import { DOMPatchSchema, DOMPatchView } from './vdom'
import { NetworkMessageSchema, NetworkMessageView } from './network'
import { ConsoleMessageSchema, ConsoleMessageView } from './console'
import {
  AnyDescriptor,
  createView,
  StructDescriptor,
  UINT32,
  UINT8,
  UnionDescriptor,
} from '@repro/typed-binary-encoder'

// type SourceEventType: enum {
//   Snapshot = 0
//   DOMPatch = 10
//   Interaction = 20
//   Network = 30
//   Console = 40
//   CloseRecording = 99
// }

export enum SourceEventType {
  Snapshot = 0,
  DOMPatch = 10,
  Interaction = 20,
  Network = 30,
  Console = 40,
  CloseRecording = 99,
}

export const SourceEventTypeSchema = z.nativeEnum(SourceEventType)

function createSourceEventView<T extends SourceEvent>(
  descriptor: AnyDescriptor,
  schema: ZodType<Partial<T>, ZodTypeDef, T>
) {
  return createView<T, StructDescriptor>(
    {
      type: 'struct',
      fields: [
        ['type', UINT8],
        ['time', UINT32],
        ['data', descriptor],
      ],
    },
    schema
  )
}

export const SnapshotEventSchema = z.object({
  type: z.literal(SourceEventType.Snapshot),
  time: z
    .number()
    .min(0)
    .max(2 ** 32 - 1),
  data: SnapshotSchema,
})

export type SnapshotEvent = z.infer<typeof SnapshotEventSchema>

export const SnapshotEventView = createSourceEventView(
  SnapshotView.descriptor,
  SnapshotEventSchema
)

// type DOMPatchEvent: struct {
//   type: SourceEventType.DOMPatch
//   time: uint32
//   data: DOMPatch
// }

export const DOMPatchEventSchema = z.object({
  type: z.literal(SourceEventType.DOMPatch),
  time: z
    .number()
    .min(0)
    .max(2 ** 32 - 1),
  data: DOMPatchSchema,
})

export type DOMPatchEvent = z.infer<typeof DOMPatchEventSchema>

export const DOMPatchEventView = createSourceEventView<DOMPatchEvent>(
  DOMPatchView.descriptor,
  DOMPatchEventSchema
)

// type InteractionEvent: struct {
//   type: SourceEventType.Interaction
//   time: uint32
//   data: Interaction
// }

export const InteractionEventSchema = z.object({
  type: z.literal(SourceEventType.Interaction),
  time: z
    .number()
    .min(0)
    .max(2 ** 32 - 1),
  data: InteractionSchema,
})

export type InteractionEvent = z.infer<typeof InteractionEventSchema>

export const InteractionEventView = createSourceEventView<InteractionEvent>(
  InteractionView.descriptor,
  InteractionEventSchema
)

// type NetworkEvent: struct {
//   type: SourceEventType.Network
//   time: uint32
//   data: NetworkMessage
// }

export const NetworkEventSchema = z.object({
  type: z.literal(SourceEventType.Network),
  time: z
    .number()
    .min(0)
    .max(2 ** 32 - 1),
  data: NetworkMessageSchema,
})

export type NetworkEvent = z.infer<typeof NetworkEventSchema>

export const NetworkEventView = createSourceEventView<NetworkEvent>(
  NetworkMessageView.descriptor,
  NetworkEventSchema
)

// type ConsoleEvent: struct {
//   type: SourceEventType.Console
//   time: uint32
//   data: ConsoleMessage
// }

export const ConsoleEventSchema = z.object({
  type: z.literal(SourceEventType.Console),
  time: z
    .number()
    .min(0)
    .max(2 ** 32 - 1),
  data: ConsoleMessageSchema,
})

export type ConsoleEvent = z.infer<typeof ConsoleEventSchema>

// export interface ConsoleEvent {
//   type: SourceEventType.Console
//   time: number
//   data: ConsoleMessage
// }

export const ConsoleEventView = createSourceEventView<ConsoleEvent>(
  ConsoleMessageView.descriptor,
  ConsoleEventSchema
)

// type CloseRecordingEvent: struct {
//   type: SourceEventType.CloseRecording
//   time: uint32
// }

export const CloseRecordingEventSchema = z.object({
  type: z.literal(SourceEventType.CloseRecording),
  time: z
    .number()
    .min(0)
    .max(2 ** 32 - 1),
})

export type CloseRecordingEvent = z.infer<typeof CloseRecordingEventSchema>

export const CloseRecordingEventView = createView<
  CloseRecordingEvent,
  StructDescriptor
>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['time', UINT32],
    ],
  },
  CloseRecordingEventSchema
)

// type SourceEvent: union on "type" {
//   SnapshotEvent
//   DOMPatchEvent
//   InteractionEvent
//   NetworkEvent
//   ConsoleEvent
//   CloseRecordingEvent
// }

export const SourceEventSchema = z.discriminatedUnion('type', [
  SnapshotEventSchema,
  DOMPatchEventSchema,
  InteractionEventSchema,
  NetworkEventSchema,
  ConsoleEventSchema,
  CloseRecordingEventSchema,
])

export type SourceEvent = z.infer<typeof SourceEventSchema>

export const SourceEventView = createView<SourceEvent, UnionDescriptor>(
  {
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
  },
  SourceEventSchema
)
