import {
  createView,
  DictDescriptor,
  StructDescriptor,
  UINT16,
  UINT8,
  UnionDescriptor,
} from '@repro/typed-binary-encoder'
import z from 'zod'

import { PointView, PointSchema } from './point'
import { NodeIdSchema, NodeIdView } from './vdom'

// type ScrollMap: map<NodeId, Point>

export const ScrollMapSchema = z.record(NodeIdSchema, PointSchema)
export type ScrollMap = z.infer<typeof ScrollMapSchema>
export const ScrollMapView = createView<ScrollMap, DictDescriptor>({
  type: 'dict',
  key: NodeIdView.descriptor,
  value: PointView.descriptor,
})

// type InteractionType: enum {
//   ViewportResize
//   Scroll
//   PointerMove
//   PointerDown
//   PointerUp
//   KeyDown
//   KeyUp
// }

export enum InteractionType {
  ViewportResize = 0,
  Scroll = 1,
  PointerMove = 2,
  PointerDown = 3,
  PointerUp = 4,
  KeyDown = 5,
  KeyUp = 6,
}

export const InteractionTypeSchema = z.nativeEnum(InteractionType)

// type PointerState: enum {
//   Up
//   Down
// }

export enum PointerState {
  Up,
  Down,
}

export const PointerStateSchema = z.nativeEnum(PointerState)

// type ViewportResize: struct {
//   type: InteractionType.ViewportResize
//   from: Point
//   to: Point
//   duration: uint16
// }

export const ViewportResizeSchema = z.object({
  type: z.literal(InteractionType.ViewportResize),
  from: PointSchema,
  to: PointSchema,
  duration: z
    .number()
    .min(0)
    .max(2 ** 16 - 1),
})

export type ViewportResize = z.infer<typeof ViewportResizeSchema>

export const ViewportResizeView = createView<ViewportResize, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['from', PointView.descriptor],
      ['to', PointView.descriptor],
      ['duration', UINT16],
    ],
  },
  ViewportResizeSchema
)

// type Scroll: struct {
//   type: InteractionType.Scroll
//   target: NodeId
//   from: Point
//   to: Point
//   duratoin: uint16
// }

export const ScrollSchema = z.object({
  type: z.literal(InteractionType.Scroll),
  target: NodeIdSchema,
  from: PointSchema,
  to: PointSchema,
  duration: z
    .number()
    .min(0)
    .max(2 ** 16 - 1),
})

export type Scroll = z.infer<typeof ScrollSchema>

export const ScrollView = createView<Scroll, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['target', { type: 'char', bytes: 5 }],
      ['from', PointView.descriptor],
      ['to', PointView.descriptor],
      ['duration', UINT16],
    ],
  },
  ScrollSchema
)

// type PointerMove: struct {
//   type: InteractionType.PointerMove
//   from: Point
//   to: Point
//   duration: uint16
// }

export const PointerMoveSchema = z.object({
  type: z.literal(InteractionType.PointerMove),
  from: PointSchema,
  to: PointSchema,
  duration: z
    .number()
    .min(0)
    .max(2 ** 16 - 1),
})

export type PointerMove = z.infer<typeof PointerMoveSchema>

export const PointerMoveView = createView<PointerMove, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['from', PointView.descriptor],
      ['to', PointView.descriptor],
      ['duration', UINT16],
    ],
  },
  PointerMoveSchema
)

// type PointerDown: struct {
//   type: InteractionType.PointerDown
//   targets: vector<NodeId>
//   at: Point
// }

export const PointerDownSchema = z.object({
  type: z.literal(InteractionType.PointerDown),
  targets: z.array(NodeIdSchema),
  at: PointSchema,
})

export type PointerDown = z.infer<typeof PointerDownSchema>

export const PointerDownView = createView<PointerDown, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['targets', { type: 'vector', items: { type: 'char', bytes: 5 } }],
      ['at', PointView.descriptor],
    ],
  },
  PointerDownSchema
)

// type PointerUp: struct {
//   type: InteractionType.PointerUp
//   targets: vector<NodeId>
//   at: Point
// }

export const PointerUpSchema = z.object({
  type: z.literal(InteractionType.PointerUp),
  targets: z.array(NodeIdSchema),
  at: PointSchema,
})

export type PointerUp = z.infer<typeof PointerUpSchema>

export const PointerUpView = createView<PointerUp, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['targets', { type: 'vector', items: { type: 'char', bytes: 5 } }],
      ['at', PointView.descriptor],
    ],
  },
  PointerUpSchema
)

// type KeyDown: struct {
//   type: InteractionType.KeyDown
//   key: string
// }

export const KeyDownSchema = z.object({
  type: z.literal(InteractionType.KeyDown),
  key: z.string(),
})

export type KeyDown = z.infer<typeof KeyDownSchema>

export const KeyDownView = createView<KeyDown, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['key', { type: 'string' }],
    ],
  },
  KeyDownSchema
)

// type KeyUp: struct {
//   type: InteractionType.KeyUp
//   key: string
// }

export const KeyUpSchema = z.object({
  type: z.literal(InteractionType.KeyUp),
  key: z.string(),
})

export type KeyUp = z.infer<typeof KeyUpSchema>

export const KeyUpView = createView<KeyUp, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['key', { type: 'string' }],
    ],
  },
  KeyUpSchema
)

// type Interaction: union {
//   ViewportResize
//   Scroll
//   PointerMove
//   PointerUp
//   PointerDown
//   KeyUp
//   KeyDown
// }

export const InteractionSchema = z.discriminatedUnion('type', [
  ViewportResizeSchema,
  ScrollSchema,
  PointerMoveSchema,
  PointerUpSchema,
  KeyDownSchema,
  KeyUpSchema,
])

export type Interaction = z.infer<typeof InteractionSchema>

export const InteractionView = createView<Interaction, UnionDescriptor>(
  {
    type: 'union',
    tagField: 'type',
    descriptors: {
      [InteractionType.ViewportResize]: ViewportResizeView.descriptor,
      [InteractionType.Scroll]: ScrollView.descriptor,
      [InteractionType.PointerMove]: PointerMoveView.descriptor,
      [InteractionType.PointerUp]: PointerUpView.descriptor,
      [InteractionType.PointerDown]: PointerDownView.descriptor,
      [InteractionType.KeyUp]: KeyUpView.descriptor,
      [InteractionType.KeyDown]: KeyDownView.descriptor,
    },
  },
  InteractionSchema
)
