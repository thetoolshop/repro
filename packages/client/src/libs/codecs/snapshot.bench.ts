import { approxByteLength } from '@/libs/record/buffer-utils'
import { PointerState } from '@/types/interaction'
import { Snapshot } from '@/types/recording'
import { stress } from '@/utils/bench'
import {
  documentNode,
  docTypeNode,
  elementNode,
  textNode,
} from './fixtures/vdom'
import { encodeSnapshot } from './snapshot'

const snapshot: Snapshot = {
  dom: {
    rootId: documentNode.id,
    nodes: {
      [documentNode.id]: documentNode,
      [docTypeNode.id]: docTypeNode,
      [elementNode.id]: elementNode,
      [textNode.id]: textNode,
    },
  },

  interaction: {
    pointer: [960, 640],
    pointerState: PointerState.Up,
    scroll: {
      [documentNode.id]: [0, 0],
      [elementNode.id]: [50, 250],
    },
    viewport: [1200, 800],
  },
}

console.table({
  Snapshot: {
    raw: approxByteLength(snapshot),
    binary: approxByteLength(encodeSnapshot(snapshot)),
    perf_encode: stress(() => encodeSnapshot(snapshot)),
  },
})
