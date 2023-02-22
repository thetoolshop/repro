import {
  AnyDescriptor,
  createView,
  StructDescriptor,
  UINT32,
  UINT8,
  UnionDescriptor,
} from '@repro/typed-binary-encoder'
import z, { ZodType, ZodTypeDef } from 'zod'
import { uint32 } from './common'
import { InteractionSchema, InteractionView } from './interaction'
import { SnapshotSchema, SnapshotView } from './snapshot'
import { DOMPatchSchema, DOMPatchView } from './vdom'
import { NetworkMessageSchema, NetworkMessageView } from './network'
import { ConsoleMessageSchema, ConsoleMessageView } from './console'
import { PerformanceEntrySchema, PerformanceEntryView } from './performance'

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
  Performance = 50,
  CloseRecording = 99,
}

export const SourceEventTypeSchema = z.nativeEnum(SourceEventType)

function createSourceEventView<T extends SourceEvent>(
  descriptor: AnyDescriptor,
  schema: ZodType<T, ZodTypeDef>
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
  time: uint32,
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
  time: uint32,
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
  time: uint32,
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
  time: uint32,
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
  time: uint32,
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

// type PerformanceEvent: struct {
//   type: SourceEventType.Performance
//   time: uint32
//   data: PerformanceEntry
// }

export const PerformanceEventSchema = z.object({
  type: z.literal(SourceEventType.Performance),
  time: uint32,
  data: PerformanceEntrySchema,
})

export type PerformanceEvent = z.infer<typeof PerformanceEventSchema>

export const PerformanceEventView = createSourceEventView<PerformanceEvent>(
  PerformanceEntryView.descriptor,
  PerformanceEventSchema
)

// type SourceEvent: union on "type" {
//   SnapshotEvent
//   DOMPatchEvent
//   InteractionEvent
//   NetworkEvent
//   ConsoleEvent
// }

export const SourceEventSchema = z.discriminatedUnion('type', [
  SnapshotEventSchema,
  DOMPatchEventSchema,
  InteractionEventSchema,
  NetworkEventSchema,
  ConsoleEventSchema,
  PerformanceEventSchema,
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
      [SourceEventType.Performance]: PerformanceEventView.descriptor,
    },
  },
  SourceEventSchema
)
