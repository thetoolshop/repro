import {
  createView,
  StructDescriptor,
  UINT16,
  UINT8,
  UnionDescriptor,
} from '@repro/typed-binary-encoder'

import { SyntheticId } from './common'
import { Point, PointView } from './point'
import { Sample } from './recording'

export enum InteractionType {
  ViewportResize = 0,
  Scroll = 1,
  PointerMove = 2,
  PointerDown = 3,
  PointerUp = 4,
  KeyDown = 5,
  KeyUp = 6,
}

export enum PointerState {
  Up,
  Down,
}

export interface ViewportResize extends Sample<Point> {
  type: InteractionType.ViewportResize
}

export interface Scroll extends Sample<Point> {
  type: InteractionType.Scroll
  target: SyntheticId
}

export interface PointerMove extends Sample<Point> {
  type: InteractionType.PointerMove
}

export interface PointerDown {
  type: InteractionType.PointerDown
  targets: Array<SyntheticId>
  at: Point
}

export interface PointerUp {
  type: InteractionType.PointerUp
  targets: Array<SyntheticId>
  at: Point
}

export interface KeyDown {
  type: InteractionType.KeyDown
  key: string
}

export interface KeyUp {
  type: InteractionType.KeyUp
  key: string
}

export type Interaction =
  | ViewportResize
  | Scroll
  | PointerMove
  | PointerDown
  | PointerUp
  | KeyDown
  | KeyUp

export type ScrollMap = Record<SyntheticId, Point>

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
