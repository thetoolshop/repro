import {
  Interaction,
  InteractionType,
  KeyDown,
  KeyUp,
  PointerDown,
  PointerMove,
  PointerUp,
  Scroll,
  ViewportResize,
} from '@/types/interaction'
import { PointView } from './point'
import {
  createView,
  StructDescriptor,
  UINT16,
  UINT8,
  UnionDescriptor,
} from '@/utils/encoding'

// type Point: array[2]<uint16>

// type ViewportResize: struct {
//   type: InteractionType.ViewportResize
//   from: Point
//   to: Point
//   duration: uint16
// }

export const ViewportResizeView = createView<ViewportResize, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['from', PointView.descriptor],
    ['to', PointView.descriptor],
    ['duration', UINT16],
  ],
})

// type Scroll: struct {
//   type: InteractionType.Scroll
//   target: NodeId
//   from: Point
//   to: Point
//   duration: uint16
// }

export const ScrollView = createView<Scroll, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['target', { type: 'char', bytes: 5 }],
    ['from', PointView.descriptor],
    ['to', PointView.descriptor],
    ['duration', UINT16],
  ],
})

// type PointerMove: struct {
//   type: InteractionType.PointerMove
//   from: Point
//   to: Point
//   duration: uint16
// }

export const PointerMoveView = createView<PointerMove, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['from', PointView.descriptor],
    ['to', PointView.descriptor],
    ['duration', UINT16],
  ],
})

// type PointerUp: struct {
//   type: InteractionType.PointerUp
//   targets: vector<NodeId>
//   at: Point
// }

export const PointerUpView = createView<PointerUp, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['targets', { type: 'vector', items: { type: 'char', bytes: 5 } }],
    ['at', PointView.descriptor],
  ],
})

// type PointerDown: struct {
//   type: InteractionType.PointerUp
//   targets: vector<NodeId>
//   at: Point
// }

export const PointerDownView = createView<PointerDown, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['targets', { type: 'vector', items: { type: 'char', bytes: 5 } }],
    ['at', PointView.descriptor],
  ],
})

// type KeyUp: struct {
//   type: InteractionType.KeyUp
//   key: string
// }

export const KeyUpView = createView<KeyUp, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['key', { type: 'string' }],
  ],
})

// type KeyDown: struct {
//   type: InteractionType.KeyDown
//   key: string
// }

export const KeyDownView = createView<KeyDown, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['key', { type: 'string' }],
  ],
})

// type Interaction: union {
//   ViewportResize
//   Scroll
//   PointerMove
//   PointerUp
//   PointerDown
//   KeyUp
//   KeyDown
// }

export const InteractionView = createView<Interaction, UnionDescriptor>({
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
})
