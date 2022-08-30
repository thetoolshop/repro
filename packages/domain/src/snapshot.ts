import {
  createView,
  StructDescriptor,
  UINT8,
} from '@repro/typed-binary-encoder'
import { PointerState, ScrollMap } from './interaction'
import { Point, PointView } from './point'
import { NodeId, VTree, VTreeView } from './vdom'

export interface InteractionSnapshot {
  pointer: Point
  pointerState: PointerState
  scroll: ScrollMap
  viewport: Point
}

export const InteractionSnapshotView = createView<
  InteractionSnapshot,
  StructDescriptor
>({
  type: 'struct',
  fields: [
    ['pointer', PointView.descriptor],
    ['pointerState', UINT8],
    ['scroll', { type: 'dict', key: NodeId, value: PointView.descriptor }],
    ['viewport', PointView.descriptor],
  ],
})

export interface Snapshot {
  dom: VTree | null
  interaction?: InteractionSnapshot
}

export const SnapshotView = createView<Snapshot, StructDescriptor>({
  type: 'struct',
  fields: [
    ['dom', { ...VTreeView.descriptor, nullable: true }],
    ['interaction', { ...InteractionSnapshotView.descriptor, nullable: true }],
  ],
})
