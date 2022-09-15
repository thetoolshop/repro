import {
  createView,
  StructDescriptor,
  UINT8,
} from '@repro/typed-binary-encoder'
import z from 'zod'
import {
  PointerStateSchema,
  ScrollMapSchema,
  ScrollMapView,
} from './interaction'
import { PointSchema, PointView } from './point'
import { VTreeSchema, VTreeView } from './vdom'

// type InteractionSnapshot: struct {
//   pointer: Point
//   pointerState: PointerState
//   scroll: ScrollMap
//   viewport: Point
// }

export const InteractionSnapshotSchema = z.object({
  pointer: PointSchema,
  pointerState: PointerStateSchema,
  scroll: ScrollMapSchema,
  viewport: PointSchema,
})

export type InteractionSnapshot = z.infer<typeof InteractionSnapshotSchema>

export const InteractionSnapshotView = createView<
  InteractionSnapshot,
  StructDescriptor
>(
  {
    type: 'struct',
    fields: [
      ['pointer', PointView.descriptor],
      ['pointerState', UINT8],
      ['scroll', ScrollMapView.descriptor],
      ['viewport', PointView.descriptor],
    ],
  },
  InteractionSnapshotSchema
)

// type Snapshot: struct {
//   dom?: VTree
//   interaction?: InteractionSnapshotSchema
// }

export const SnapshotSchema = z.object({
  dom: VTreeSchema.nullable(),
  interaction: InteractionSnapshotSchema.nullable(),
})

export type Snapshot = z.infer<typeof SnapshotSchema>

export const SnapshotView = createView<Snapshot, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['dom', VTreeView.nullable().descriptor],
      ['interaction', InteractionSnapshotView.nullable().descriptor],
    ],
  },
  SnapshotSchema
)
