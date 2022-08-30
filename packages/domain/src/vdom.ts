import {
  CharDescriptor,
  createView,
  StructDescriptor,
  UINT8,
  UnionDescriptor,
} from '@repro/typed-binary-encoder'
import { nanoid } from 'nanoid'
import type { SyntheticId } from './common'

export enum NodeType {
  DocType = 0,
  Document = 1,
  Element = 2,
  Text = 3,
}

export interface VDocType {
  id: SyntheticId
  parentId: SyntheticId | null
  type: NodeType.DocType
  name: string
  publicId: string
  systemId: string
}

export interface VDocument {
  id: SyntheticId
  parentId: SyntheticId | null
  type: NodeType.Document
  children: Array<SyntheticId>
}

export interface VElement {
  id: SyntheticId
  parentId: SyntheticId | null
  type: NodeType.Element
  tagName: string
  attributes: Record<string, string | null>
  // TODO: investigate other plausible properties
  properties: Partial<{
    value: string
    checked: boolean
    selectedIndex: number
  }>
  children: Array<SyntheticId>
}

export interface VText {
  id: SyntheticId
  parentId: SyntheticId | null
  type: NodeType.Text
  value: string
}

export type VNode = VDocument | VDocType | VElement | VText

export interface VTree {
  rootId: SyntheticId
  nodes: Record<SyntheticId, VNode>
}

export enum PatchType {
  Attribute = 0,
  Text = 1,
  AddNodes = 2,
  RemoveNodes = 3,
  TextProperty = 4,
  NumberProperty = 5,
  BooleanProperty = 6,
}

export interface AttributePatch {
  type: PatchType.Attribute
  targetId: SyntheticId
  name: string
  value: string | null
  oldValue: string | null
}

export interface TextPropertyPatch {
  type: PatchType.TextProperty
  targetId: SyntheticId
  name: string
  value: string
  oldValue: string
}

export interface NumberPropertyPatch {
  type: PatchType.NumberProperty
  targetId: SyntheticId
  name: string
  value: number
  oldValue: number
}

export interface BooleanPropertyPatch {
  type: PatchType.BooleanProperty
  targetId: SyntheticId
  name: string
  value: boolean
  oldValue: boolean
}

export interface TextPatch {
  type: PatchType.Text
  targetId: SyntheticId
  value: string
  oldValue: string
}

export interface AddNodesPatch {
  type: PatchType.AddNodes
  parentId: SyntheticId
  previousSiblingId: SyntheticId | null
  nextSiblingId: SyntheticId | null
  nodes: Array<VTree>
}

export interface RemoveNodesPatch {
  type: PatchType.RemoveNodes
  parentId: SyntheticId
  previousSiblingId: SyntheticId | null
  nextSiblingId: SyntheticId | null
  nodes: Array<VTree>
}

export type Patch =
  | AttributePatch
  | TextPropertyPatch
  | NumberPropertyPatch
  | BooleanPropertyPatch
  | TextPatch
  | AddNodesPatch
  | RemoveNodesPatch
export const NODE_TYPE_BYTE_LENGTH = 1
export const NODE_ID_BYTE_LENGTH = 5
export const PATCH_TYPE_BYTE_LENGTH = 1

export function createNodeId() {
  return nanoid(NODE_ID_BYTE_LENGTH)
}

// type NodeId: char[5]
export const NodeId: CharDescriptor = {
  type: 'char',
  bytes: NODE_ID_BYTE_LENGTH,
}

export const NullableNodeId: CharDescriptor = {
  type: 'char',
  bytes: NODE_ID_BYTE_LENGTH,
  nullable: true,
}

// type VDocType: struct {
//   type: NodeType.DocType
//   id: NodeId
//   parentId?: NodeId
//   name: string
//   publicId: string
//   systemId: string
// }

export const VDocTypeView = createView<VDocType, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['id', NodeId],
    ['parentId', NullableNodeId],
    ['name', { type: 'string' }],
    ['publicId', { type: 'string' }],
    ['systemId', { type: 'string' }],
  ],
})

export const VDocumentView = createView<VDocument, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['id', NodeId],
    ['parentId', NullableNodeId],
    ['children', { type: 'vector', items: NodeId }],
  ],
})

// type VElement: struct {
//   type: NodeType.Element
//   id: NodeId
//   parentId?: NodeId
//   tagName: string
//   children: vector<NodeId>
//   attributes: map<string, string>
//   properties: struct {
//     value?: string
//     checked?: boolean
//     selectedIndex?: int16
//   }
// }

export const VElementView = createView<VElement, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['id', NodeId],
    ['parentId', NullableNodeId],
    ['tagName', { type: 'string' }],
    ['children', { type: 'vector', items: { type: 'char', bytes: 5 } }],
    [
      'attributes',
      {
        type: 'dict',
        key: { type: 'string' },
        value: { type: 'string', nullable: true },
      },
    ],
    [
      'properties',
      {
        type: 'struct',
        fields: [
          ['value', { type: 'string', nullable: true }],
          ['checked', { type: 'bool', nullable: true }],
          [
            'selectedIndex',
            { type: 'integer', signed: true, bits: 16, nullable: true },
          ],
        ],
      },
    ],
  ],
})

// type VText: struct {
//   type: NodeType.Text
//   id: NodeId
//   parentId?: NodeId
//   value: string
// }

export const VTextView = createView<VText, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['id', NodeId],
    ['parentId', NullableNodeId],
    ['value', { type: 'string' }],
  ],
})

// type VNode: union {
//   VDocument
//   VDocType
//   VElement
//   VText
// }

export const VNodeView = createView<VNode, UnionDescriptor>({
  type: 'union',
  tagField: 'type',
  descriptors: {
    [NodeType.Document]: VDocumentView.descriptor,
    [NodeType.DocType]: VDocTypeView.descriptor,
    [NodeType.Element]: VElementView.descriptor,
    [NodeType.Text]: VTextView.descriptor,
  },
})

// type VTree: struct {
//   rootId: NodeId
//   nodes: map<NodeId, VNode>
// }

export const VTreeView = createView<VTree, StructDescriptor>({
  type: 'struct',
  fields: [
    ['rootId', NodeId],
    ['nodes', { type: 'dict', key: NodeId, value: VNodeView.descriptor }],
  ],
})

// type AttributePatch: struct {
//   type: PatchType.Attribute
//   targetId: NodeId
//   name: string
//   value?: string
//   oldValue?: string
// }

export const AttributePatchView = createView<AttributePatch, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['targetId', NodeId],
    ['name', { type: 'string' }],
    ['value', { type: 'string', nullable: true }],
    ['oldValue', { type: 'string', nullable: true }],
  ],
})

// type TextPatch: struct {
//   type: PatchType.Text
//   targetId: NodeId
//   value: string
//   oldValue: string
// }

export const TextPatchView = createView<TextPatch, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['targetId', NodeId],
    ['value', { type: 'string' }],
    ['oldValue', { type: 'string' }],
  ],
})

// type AddNodesPatch: struct {
//   type: PatchType.AddNodes
//   parentId: NodeId
//   previousSiblingId?: NodeId
//   nextSiblingId?: NodeId
//   nodes: vector<VTree>
// }

export const AddNodesPatchView = createView<AddNodesPatch, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['parentId', NodeId],
    ['previousSiblingId', NullableNodeId],
    ['nextSiblingId', NullableNodeId],
    ['nodes', { type: 'vector', items: VTreeView.descriptor }],
  ],
})

// type RemoveNodesPatch: struct {
//   type: PatchType.RemoveNodes
//   parentId: NodeId
//   previousSiblingId?: NodeId
//   nextSiblingId?: NodeId
//   nodes: vector<VTree>
// }

export const RemoveNodesPatchView = createView<
  RemoveNodesPatch,
  StructDescriptor
>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['parentId', NodeId],
    ['previousSiblingId', NullableNodeId],
    ['nextSiblingId', NullableNodeId],
    ['nodes', { type: 'vector', items: VTreeView.descriptor }],
  ],
})

// type TextPropertyPatch: struct {
//   type: PatchType.TextProperty
//   targetId: NodeId
//   name: string
//   value: string
//   oldValue: string
// }

export const TextPropertyPatchView = createView<
  TextPropertyPatch,
  StructDescriptor
>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['targetId', NodeId],
    ['name', { type: 'string' }],
    ['value', { type: 'string' }],
    ['oldValue', { type: 'string' }],
  ],
})

// type NumberPropertyPatch: struct {
//   type: PatchType.NumberProperty
//   targetId: NodeId
//   name: string
//   value: int32
//   oldValue: int32
// }

export const NumberPropertyPatchView = createView<
  NumberPropertyPatch,
  StructDescriptor
>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['targetId', NodeId],
    ['name', { type: 'string' }],
    ['value', { type: 'integer', signed: true, bits: 32 }],
    ['oldValue', { type: 'integer', signed: true, bits: 32 }],
  ],
})

// type BooleanPropertyPatch: struct {
//   type: PatchType.BooleanProperty
//   targetId: NodeId
//   name: string
//   value: bool
//   oldValue: bool
// }

export const BooleanPropertyPatchView = createView<
  BooleanPropertyPatch,
  StructDescriptor
>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['targetId', NodeId],
    ['name', { type: 'string' }],
    ['value', { type: 'bool' }],
    ['oldValue', { type: 'bool' }],
  ],
})

export const DOMPatchView = createView<Patch, UnionDescriptor>({
  type: 'union',
  tagField: 'type',
  descriptors: {
    [PatchType.Attribute]: AttributePatchView.descriptor,
    [PatchType.Text]: TextPatchView.descriptor,
    [PatchType.AddNodes]: AddNodesPatchView.descriptor,
    [PatchType.RemoveNodes]: RemoveNodesPatchView.descriptor,
    [PatchType.TextProperty]: TextPropertyPatchView.descriptor,
    [PatchType.NumberProperty]: NumberPropertyPatchView.descriptor,
    [PatchType.BooleanProperty]: BooleanPropertyPatchView.descriptor,
  },
})
