import { BufferReader, BufferWriter } from 'arraybuffer-utils'
import { SyntheticId } from '@/types/common'

import {
  AddNodesPatch,
  AttributePatch,
  BooleanPropertyPatch,
  NodeType,
  NumberPropertyPatch,
  Patch,
  PatchType,
  RemoveNodesPatch,
  TextPatch,
  TextPropertyPatch,
  VDocType,
  VDocument,
  VElement,
  VNode,
  VText,
  VTree,
} from '@/types/vdom'

import {
  UINT_8,
  UINT_16,
  UINT_32,
  LITTLE_ENDIAN,
  getByteLength,
  readString8,
  writeString8,
  readString32,
  writeString32,
  writeString16,
  readString16,
  concat,
  zeroFill,
  INT_32,
} from './common'

export const NODE_TYPE_BYTE_LENGTH = 1
export const NODE_ID_BYTE_LENGTH = 5
export const PATCH_TYPE_BYTE_LENGTH = 1

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

// Should nodeId encoder/decoder by lifted to common?
export function writeNodeId(writer: BufferWriter, nodeId: SyntheticId) {
  const bytes = textEncoder.encode(nodeId)

  if (bytes.byteLength !== NODE_ID_BYTE_LENGTH) {
    throw new Error(
      `VDOM codec: invalid node ID (${nodeId}: ${bytes.byteLength} bytes)`
    )
  }

  for (const byte of bytes) {
    writer.writeUint8(byte)
  }
}

export function readNodeId(reader: BufferReader): SyntheticId {
  const bytes: Array<number> = []

  for (let i = 0; i < NODE_ID_BYTE_LENGTH; i++) {
    bytes.push(reader.readUint8())
  }

  return textDecoder.decode(new Uint8Array(bytes))
}

export function writeNullableNodeId(
  writer: BufferWriter,
  nodeId: SyntheticId | null
) {
  if (nodeId !== null) {
    writeNodeId(writer, nodeId)
    return
  }

  // Zero-pad buffer where VNode ID is null
  for (let i = 0; i < NODE_ID_BYTE_LENGTH; i++) {
    writer.writeUint8(0)
  }
}

export function readNullableNodeId(reader: BufferReader): SyntheticId | null {
  const nextByte = reader.buffer.getUint8(reader.getOffset())
  const nodeId = readNodeId(reader)

  return nextByte !== 0 ? nodeId : null
}

export function encodeVNode(node: VNode): ArrayBuffer {
  switch (node.type) {
    case NodeType.DocType:
      return encodeVDocType(node)

    case NodeType.Document:
      return encodeVDocument(node)

    case NodeType.Element:
      return encodeVElement(node)

    case NodeType.Text:
      return encodeVText(node)
  }
}

export function decodeVNode(reader: BufferReader): VNode {
  const type: NodeType = reader.readUint8()

  switch (type) {
    case NodeType.DocType:
      return decodeVDocType(reader)

    case NodeType.Document:
      return decodeVDocument(reader)

    case NodeType.Element:
      return decodeVElement(reader)

    case NodeType.Text:
      return decodeVText(reader)
  }
}

export function encodeVDocType(node: VDocType): ArrayBuffer {
  const byteLength =
    NODE_TYPE_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    UINT_8 +
    getByteLength(node.name) +
    UINT_8 +
    getByteLength(node.publicId) +
    UINT_8 +
    getByteLength(node.systemId)

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(node.type)
  writeNodeId(writer, node.id)
  writeNullableNodeId(writer, node.parentId)
  writeString8(writer, node.name)
  writeString8(writer, node.publicId)
  writeString8(writer, node.systemId)

  return buffer
}

export function decodeVDocType(reader: BufferReader): VDocType {
  const type = NodeType.DocType
  const id = readNodeId(reader)
  const parentId = readNullableNodeId(reader)
  const name = readString8(reader)
  const publicId = readString8(reader)
  const systemId = readString8(reader)

  return {
    type,
    id,
    parentId,
    name,
    publicId,
    systemId,
  }
}

export function encodeVDocument(node: VDocument): ArrayBuffer {
  const byteLength =
    NODE_TYPE_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    UINT_16 +
    node.children.length * NODE_ID_BYTE_LENGTH

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(node.type)
  writeNodeId(writer, node.id)
  writeNullableNodeId(writer, node.parentId)
  writer.writeUint16(node.children.length)

  for (const child of node.children) {
    writeNodeId(writer, child)
  }

  return buffer
}

export function decodeVDocument(reader: BufferReader): VDocument {
  const type = NodeType.Document
  const id = readNodeId(reader)
  const parentId = readNullableNodeId(reader)

  const len = reader.readUint16()
  const children: Array<SyntheticId> = []

  for (let i = 0; i < len; i++) {
    children.push(readNodeId(reader))
  }

  return {
    type,
    id,
    parentId,
    children,
  }
}

enum PropertyType {
  Text = 0,
  Number = 1,
  Boolean = 2,
}

export function encodeVElement(node: VElement): ArrayBuffer {
  const tagNameByteLength = getByteLength(node.tagName)

  const attrEntries = Object.entries(node.attributes)
  const attrByteLength = attrEntries.flatMap(([key, value]) => [
    UINT_8 + getByteLength(key),
    UINT_32 + (value !== null ? getByteLength(value) : 0),
  ])
  const attrByteLengthTotal = attrByteLength.reduce(
    (acc, byteLength) => acc + byteLength,
    0
  )

  const propEntries = Object.entries(node.properties)
  const propByteLength = propEntries.flatMap(([key, value]) => {
    let valueByteLength: number

    if (typeof value === 'string') {
      valueByteLength = UINT_32 + getByteLength(value)
    } else if (typeof value === 'number') {
      valueByteLength = INT_32
    } else {
      valueByteLength = UINT_8
    }

    return [UINT_8, UINT_8 + getByteLength(key), valueByteLength]
  })
  const propByteLengthTotal = propByteLength.reduce(
    (acc, byteLength) => acc + byteLength,
    0
  )

  const byteLength =
    NODE_TYPE_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    UINT_8 +
    tagNameByteLength +
    UINT_16 +
    node.children.length * NODE_ID_BYTE_LENGTH +
    UINT_16 +
    attrByteLengthTotal +
    UINT_16 +
    propByteLengthTotal

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(node.type)
  writeNodeId(writer, node.id)
  writeNullableNodeId(writer, node.parentId)
  writeString8(writer, node.tagName)

  writer.writeUint16(node.children.length)
  for (const child of node.children) {
    writeNodeId(writer, child)
  }

  writer.writeUint16(attrEntries.length)
  for (const [key, value] of attrEntries) {
    writeString8(writer, key)
    writeString32(writer, value ?? '')
  }

  writer.writeUint16(propEntries.length)
  for (const [key, value] of propEntries) {
    let propType: PropertyType

    if (typeof value === 'string') {
      propType = PropertyType.Text
    } else if (typeof value === 'number') {
      propType = PropertyType.Number
    } else {
      propType = PropertyType.Boolean
    }

    writer.writeUint8(propType)
    writeString8(writer, key)

    if (typeof value === 'string') {
      writeString32(writer, value)
    } else if (typeof value === 'number') {
      writer.writeInt32(value)
    } else {
      writer.writeUint8(Number(value))
    }
  }

  return buffer
}

export function decodeVElement(reader: BufferReader): VElement {
  const type = NodeType.Element
  const id = readNodeId(reader)
  const parentId = readNullableNodeId(reader)
  const tagName = readString8(reader)

  const childrenLength = reader.readUint16()
  const children: Array<SyntheticId> = []

  for (let i = 0; i < childrenLength; i++) {
    children.push(readNodeId(reader))
  }

  const attrLength = reader.readUint16()
  const attrEntries: Array<[string, string | null]> = []

  for (let j = 0; j < attrLength; j++) {
    attrEntries.push([readString8(reader), readString32(reader)])
  }

  const attributes: Record<string, string | null> = attrEntries.reduce(
    (acc, entry) => ({ ...acc, [entry[0]]: entry[1] }),
    {}
  )

  const propLength = reader.readUint16()
  const propEntries: Array<[string, string | number | boolean]> = []

  for (let k = 0; k < propLength; k++) {
    const propType = reader.readUint8()
    const name = readString8(reader)
    let value: string | number | boolean

    if (propType === PropertyType.Text) {
      value = readString32(reader)
    } else if (propType === PropertyType.Number) {
      value = reader.readInt32()
    } else {
      value = !!reader.readUint8()
    }

    propEntries.push([name, value])
  }

  const properties: Record<string, string | number | boolean> =
    propEntries.reduce((acc, entry) => ({ ...acc, [entry[0]]: entry[1] }), {})

  return {
    type,
    id,
    parentId,
    tagName,
    children,
    attributes,
    properties,
  }
}

export function encodeVText(node: VText): ArrayBuffer {
  const byteLength =
    NODE_TYPE_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    UINT_32 +
    getByteLength(node.value)

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(node.type)
  writeNodeId(writer, node.id)
  writeNullableNodeId(writer, node.parentId)
  writeString32(writer, node.value)

  return buffer
}

export function decodeVText(reader: BufferReader): VText {
  const type = NodeType.Text
  const id = readNodeId(reader)
  const parentId = readNullableNodeId(reader)
  const value = readString32(reader)

  return {
    type,
    id,
    parentId,
    value,
  }
}

export function encodeVTree(vtree: VTree): ArrayBuffer {
  const rootIdBuffer = new ArrayBuffer(NODE_ID_BYTE_LENGTH)
  const writer = new BufferWriter(rootIdBuffer, 0, LITTLE_ENDIAN)
  writeNodeId(writer, vtree.rootId)

  const nodeBuffers = Object.values(vtree.nodes).map(encodeVNode)

  const buffer = concat([
    rootIdBuffer,
    new Uint32Array([nodeBuffers.length]).buffer,
    ...nodeBuffers,
  ])

  return buffer
}

export function decodeVTree(reader: BufferReader): VTree {
  const rootId = readNodeId(reader)

  const nodesLength = reader.readUint32()
  const nodes: Record<SyntheticId, VNode> = {}

  for (let i = 0; i < nodesLength; i++) {
    const node = decodeVNode(reader)
    nodes[node.id] = node
  }

  return {
    rootId,
    nodes,
  }
}

export function encodePatch(patch: Patch): ArrayBuffer {
  switch (patch.type) {
    case PatchType.Attribute:
      return encodeAttributePatch(patch)

    case PatchType.Text:
      return encodeTextPatch(patch)

    case PatchType.AddNodes:
      return encodeAddNodesPatch(patch)

    case PatchType.RemoveNodes:
      return encodeRemoveNodesPatch(patch)

    case PatchType.TextProperty:
      return encodeTextPropertyPatch(patch)

    case PatchType.NumberProperty:
      return encodeNumberPropertyPatch(patch)

    case PatchType.BooleanProperty:
      return encodeBooleanPropertyPatch(patch)
  }
}

export function decodePatch(reader: BufferReader): Patch {
  const type: PatchType = reader.readUint8()

  switch (type) {
    case PatchType.Attribute:
      return decodeAttributePatch(reader)

    case PatchType.Text:
      return decodeTextPatch(reader)

    case PatchType.AddNodes:
      return decodeAddNodesPatch(reader)

    case PatchType.RemoveNodes:
      return decodeRemoveNodesPatch(reader)

    case PatchType.TextProperty:
      return decodeTextPropertyPatch(reader)

    case PatchType.NumberProperty:
      return decodeNumberPropertyPatch(reader)

    case PatchType.BooleanProperty:
      return decodeBooleanPropertyPatch(reader)
  }
}

export function encodeAttributePatch(patch: AttributePatch): ArrayBuffer {
  const byteLength =
    PATCH_TYPE_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    UINT_8 +
    getByteLength(patch.name) +
    UINT_16 +
    getByteLength(patch.value ?? '') +
    UINT_16 +
    getByteLength(patch.oldValue ?? '')

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(patch.type)
  writeNodeId(writer, patch.targetId)
  writeString8(writer, patch.name)
  writeString16(writer, patch.value ?? '')
  writeString16(writer, patch.oldValue ?? '')

  return buffer
}

export function decodeAttributePatch(reader: BufferReader): AttributePatch {
  const type = PatchType.Attribute
  const targetId = readNodeId(reader)
  const name = readString8(reader)
  const value = readString16(reader)
  const oldValue = readString16(reader)

  return {
    type,
    targetId,
    name,
    value,
    oldValue,
  }
}

export function encodeTextPatch(patch: TextPatch): ArrayBuffer {
  const byteLength =
    PATCH_TYPE_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    UINT_32 +
    getByteLength(patch.value) +
    UINT_32 +
    getByteLength(patch.oldValue)

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(patch.type)
  writeNodeId(writer, patch.targetId)
  writeString32(writer, patch.value)
  writeString32(writer, patch.oldValue)

  return buffer
}

export function decodeTextPatch(reader: BufferReader): TextPatch {
  const type = PatchType.Text
  const targetId = readNodeId(reader)
  const value = readString32(reader)
  const oldValue = readString32(reader)

  return {
    type,
    targetId,
    value,
    oldValue,
  }
}

function encodeAddRemoveNodesPatch(
  patch: AddNodesPatch | RemoveNodesPatch
): ArrayBuffer {
  const byteLength =
    PATCH_TYPE_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    UINT_8 +
    NODE_ID_BYTE_LENGTH +
    UINT_8 +
    NODE_ID_BYTE_LENGTH +
    UINT_16

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(patch.type)
  writeNodeId(writer, patch.parentId)

  if (patch.previousSiblingId) {
    writer.writeUint8(1)
    writeNodeId(writer, patch.previousSiblingId)
  } else {
    writer.writeUint8(0)
    zeroFill(writer, NODE_ID_BYTE_LENGTH)
  }

  if (patch.nextSiblingId) {
    writer.writeUint8(1)
    writeNodeId(writer, patch.nextSiblingId)
  } else {
    writer.writeUint8(0)
    zeroFill(writer, NODE_ID_BYTE_LENGTH)
  }

  const vtreeBuffers = patch.nodes.map(encodeVTree)
  writer.writeUint16(vtreeBuffers.length)

  return vtreeBuffers.reduce((acc, buf) => {
    return concat([acc, buf])
  }, buffer)
}

function decodeAddRemoveNodesPatch(
  type: PatchType.AddNodes | PatchType.RemoveNodes,
  reader: BufferReader
): AddNodesPatch | RemoveNodesPatch {
  const parentId = readNodeId(reader)

  const hasPreviousSiblingId = !!reader.readUint8()
  let previousSiblingId: string | null = readNodeId(reader)

  if (!hasPreviousSiblingId) {
    previousSiblingId = null
  }

  const hasNextSiblingId = !!reader.readUint8()
  let nextSiblingId: string | null = readNodeId(reader)

  if (!hasNextSiblingId) {
    nextSiblingId = null
  }

  const vtreesLength = reader.readUint16()
  const nodes: Array<VTree> = []

  for (let i = 0; i < vtreesLength; i++) {
    nodes.push(decodeVTree(reader))
  }

  return {
    type,
    parentId,
    previousSiblingId,
    nextSiblingId,
    nodes,
  }
}

export function encodeAddNodesPatch(patch: AddNodesPatch): ArrayBuffer {
  return encodeAddRemoveNodesPatch(patch)
}

export function decodeAddNodesPatch(reader: BufferReader): AddNodesPatch {
  return decodeAddRemoveNodesPatch(PatchType.AddNodes, reader) as AddNodesPatch
}

export function encodeRemoveNodesPatch(patch: RemoveNodesPatch): ArrayBuffer {
  return encodeAddRemoveNodesPatch(patch)
}

export function decodeRemoveNodesPatch(reader: BufferReader): RemoveNodesPatch {
  return decodeAddRemoveNodesPatch(
    PatchType.RemoveNodes,
    reader
  ) as RemoveNodesPatch
}

export function encodeTextPropertyPatch(patch: TextPropertyPatch): ArrayBuffer {
  const byteLength =
    PATCH_TYPE_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    UINT_8 +
    getByteLength(patch.name) +
    UINT_32 +
    getByteLength(patch.value) +
    UINT_32 +
    getByteLength(patch.oldValue)

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(patch.type)
  writeNodeId(writer, patch.targetId)
  writeString8(writer, patch.name)
  writeString32(writer, patch.value)
  writeString32(writer, patch.oldValue)

  return buffer
}

export function decodeTextPropertyPatch(
  reader: BufferReader
): TextPropertyPatch {
  const targetId = readNodeId(reader)
  const name = readString8(reader)
  const value = readString32(reader)
  const oldValue = readString32(reader)

  return {
    type: PatchType.TextProperty,
    targetId,
    name,
    value,
    oldValue,
  }
}

export function encodeNumberPropertyPatch(
  patch: NumberPropertyPatch
): ArrayBuffer {
  const byteLength =
    PATCH_TYPE_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    UINT_8 +
    getByteLength(patch.name) +
    INT_32 +
    INT_32

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(patch.type)
  writeNodeId(writer, patch.targetId)
  writeString8(writer, patch.name)
  writer.writeInt32(patch.value)
  writer.writeInt32(patch.oldValue)

  return buffer
}

export function decodeNumberPropertyPatch(
  reader: BufferReader
): NumberPropertyPatch {
  const targetId = readNodeId(reader)
  const name = readString8(reader)
  const value = reader.readInt32()
  const oldValue = reader.readInt32()

  return {
    type: PatchType.NumberProperty,
    targetId,
    name,
    value,
    oldValue,
  }
}

export function encodeBooleanPropertyPatch(
  patch: BooleanPropertyPatch
): ArrayBuffer {
  const byteLength =
    PATCH_TYPE_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    UINT_8 +
    getByteLength(patch.name) +
    UINT_8 +
    UINT_8

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(patch.type)
  writeNodeId(writer, patch.targetId)
  writeString8(writer, patch.name)
  writer.writeUint8(Number(patch.value))
  writer.writeUint8(Number(patch.oldValue))

  return buffer
}

export function decodeBooleanPropertyPatch(
  reader: BufferReader
): BooleanPropertyPatch {
  const targetId = readNodeId(reader)
  const name = readString8(reader)
  const value = !!reader.readUint8()
  const oldValue = !!reader.readUint8()

  return {
    type: PatchType.BooleanProperty,
    targetId,
    name,
    value,
    oldValue,
  }
}
