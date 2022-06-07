import { InteractionSnapshot } from '@/types/interaction'
import { Snapshot } from '@/types/recording'
import { createView, StructDescriptor, UINT8 } from '@/utils/encoding'
import { PointView } from './point'
import { NodeId, VTreeView } from './vdom'

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

export const SnapshotView = createView<Snapshot, StructDescriptor>({
  type: 'struct',
  fields: [
    ['dom', { ...VTreeView.descriptor, nullable: true }],
    ['interaction', { ...InteractionSnapshotView.descriptor, nullable: true }],
  ],
})
