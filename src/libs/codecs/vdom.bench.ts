import {
  encodeVDocType,
  encodeVDocument,
  encodeVElement,
  encodeVText,
  encodeVTree,
} from '@/libs/codecs/vdom'
import { approxByteLength } from '@/libs/record/buffer-utils'
import { Point, PointerState } from '@/types/interaction'
import { Snapshot } from '@/types/recording'
import { stress } from '@/utils/bench'
import {
  documentNode,
  docTypeNode,
  elementNode,
  textNode,
} from './fixtures/vdom'
// @ts-ignore
import vtree from './fixtures/vtree-big.json'

type TypedArray = Uint8Array | Uint16Array | Uint32Array

const encoder = new TextEncoder()

const ENUM_BYTE_LENGTH = 1
const POINT_BYTE_LENGTH = 4

function isUint8Array(buffer: TypedArray): buffer is Uint8Array {
  return buffer.BYTES_PER_ELEMENT === 1
}

function isUint16Array(buffer: TypedArray): buffer is Uint16Array {
  return buffer.BYTES_PER_ELEMENT === 2
}

function merge<T extends TypedArray>(buffers: Array<T>): T {
  const length = buffers.reduce((len, buf) => len + buf.length, 0)
  const firstBuffer = buffers[0]

  if (!firstBuffer) {
    return new Uint8Array(0) as T
  }

  let dest: T

  if (isUint8Array(firstBuffer)) {
    dest = new Uint8Array(length) as T
  } else if (isUint16Array(firstBuffer)) {
    dest = new Uint16Array(length) as T
  } else {
    dest = new Uint32Array(length) as T
  }

  let offset = 0

  for (const buffer of buffers) {
    dest.set(buffer, offset)
    offset += buffer.length
  }

  return dest
}

function pointToBinary(point: Point): ArrayBuffer {
  return new Uint16Array(point)
}

// TODO: create concrete type for interaction snapshot
function interactionSnapshotToBinary(
  interaction: Snapshot['interaction']
): ArrayBuffer {
  if (!interaction) {
    return new ArrayBuffer(0)
  }

  const scrollBuffers = Object.entries(interaction.scroll).flatMap(
    ([id, point]) => [encoder.encode(id), new Uint8Array(pointToBinary(point))]
  )

  // Store scroll map cardinality as uint16
  const scrollBuffersHeader = new Uint16Array([scrollBuffers.length])
  const scrollBuffersHeaderByteLength = scrollBuffersHeader.byteLength

  const byteLength =
    POINT_BYTE_LENGTH +
    ENUM_BYTE_LENGTH +
    scrollBuffersHeaderByteLength +
    scrollBuffers.reduce((acc, buf) => acc + buf.byteLength, 0) +
    POINT_BYTE_LENGTH

  const buffer = new ArrayBuffer(byteLength)
  const view = new DataView(buffer)

  let byteOffset = 0

  for (const bytes of new Uint16Array(pointToBinary(interaction.pointer))) {
    view.setUint16(byteOffset, bytes)
    byteOffset += 2
  }

  view.setUint8(byteOffset, interaction.pointerState)
  byteOffset += 1

  for (const bytes of scrollBuffersHeader) {
    view.setUint16(byteOffset, bytes)
    byteOffset += 2
  }

  for (const buffer of scrollBuffers) {
    for (const byte of buffer) {
      view.setUint8(byteOffset, byte)
      byteOffset += 1
    }
  }

  for (const bytes of new Uint16Array(pointToBinary(interaction.viewport))) {
    view.setUint16(byteOffset, bytes)
    byteOffset += 2
  }

  return buffer
}

function snapshotToBinary(snapshot: Snapshot): ArrayBuffer {
  const vtreeBuffer = snapshot.dom
    ? encodeVTree(snapshot.dom)
    : new ArrayBuffer(0)

  const interactionBuffer = snapshot.interaction
    ? interactionSnapshotToBinary(snapshot.interaction)
    : new ArrayBuffer(0)

  const header = new Uint32Array([
    vtreeBuffer.byteLength,
    interactionBuffer.byteLength,
  ])

  return merge([
    new Uint8Array(vtreeBuffer),
    new Uint8Array(interactionBuffer),
    new Uint8Array(header.buffer),
  ])
}

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
  VDocument: {
    raw: approxByteLength(documentNode),
    binary: approxByteLength(encodeVDocument(documentNode)),
    perf_encode: stress(() => encodeVDocument(documentNode)),
  },

  VDocType: {
    raw: approxByteLength(docTypeNode),
    binary: approxByteLength(encodeVDocType(docTypeNode)),
    perf_encode: stress(() => encodeVDocType(docTypeNode)),
  },

  VElement: {
    raw: approxByteLength(elementNode),
    binary: approxByteLength(encodeVElement(elementNode)),
    perf_encode: stress(() => encodeVElement(elementNode)),
  },

  VText: {
    raw: approxByteLength(textNode),
    binary: approxByteLength(encodeVText(textNode)),
    perf_encode: stress(() => encodeVText(textNode)),
  },

  VTree: {
    raw: approxByteLength(vtree),
    binary: approxByteLength(encodeVTree(vtree)),
    // Too slow to run in benchmarks :(
    // 'perf_encode': stress(() => encodeVTree(vtree)),
  },

  Snapshot: {
    raw: approxByteLength(snapshot),
    binary: approxByteLength(snapshotToBinary(snapshot)),
    perf_encode: stress(() => snapshotToBinary(snapshot)),
  },
})
