import { randomString } from '@repro/random-string'
import {
  DOMPatchEvent,
  InteractionEvent,
  SnapshotEvent,
  SourceEventType,
} from '../event'
import { InteractionType, PointerState } from '../interaction'
import { PatchType } from '../vdom'
import { vtree } from './vdom'

export const snapshotEvent: SnapshotEvent = {
  type: SourceEventType.Snapshot,
  time: 1000,
  data: {
    dom: vtree,
    interaction: {
      pointer: [50, 50],
      pointerState: PointerState.Up,
      scroll: {
        [randomString(5)]: [0, 100],
      },
      viewport: [1200, 800],
    },
  },
}

export const pointerMoveEvent: InteractionEvent = {
  type: SourceEventType.Interaction,
  time: 1000,
  data: {
    type: InteractionType.PointerMove,
    from: [100, 100],
    to: [500, 500],
    duration: 50,
  },
}

export const viewportResizeEvent: InteractionEvent = {
  type: SourceEventType.Interaction,
  time: 1000,
  data: {
    type: InteractionType.ViewportResize,
    from: [800, 600],
    to: [1200, 800],
    duration: 250,
  },
}

export const textPatchEvent: DOMPatchEvent = {
  type: SourceEventType.DOMPatch,
  time: 1000,
  data: {
    type: PatchType.Text,
    targetId: randomString(5),
    value:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In eget bibendum nunc. Nulla at arcu vel erat varius ultricies quis sed mauris. Proin scelerisque aliquam dictum. Nunc id interdum leo. Morbi erat metus, vehicula quis massa a, placerat ultrices leo. Praesent egestas maximus aliquet.',
    oldValue:
      'Proin diam ex, pharetra vel tortor sit amet, suscipit mattis purus. Integer quis diam at tortor semper interdum eu ac ante. Vestibulum iaculis condimentum mauris, vitae feugiat orci. Maecenas sed orci venenatis, tincidunt odio ut, bibendum felis. Phasellus vestibulum quam quis ligula posuere sodales. Nunc a libero sagittis, scelerisque est vel, accumsan justo. Cras blandit pulvinar elementum.',
  },
}

export const attributePatchEvent: DOMPatchEvent = {
  type: SourceEventType.DOMPatch,
  time: 1000,
  data: {
    type: PatchType.Attribute,
    targetId: randomString(5),
    name: 'class',
    value: 'foo bar',
    oldValue: 'foo',
  },
}

export const addNodesPatchEvent: DOMPatchEvent = {
  type: SourceEventType.DOMPatch,
  time: 1000,
  data: {
    type: PatchType.AddNodes,
    parentId: randomString(5),
    previousSiblingId: null,
    nextSiblingId: randomString(5),
    nodes: [vtree],
  },
}
