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
  CharDescriptor,
  createView,
  StructDescriptor,
  UINT8,
  UnionDescriptor,
} from '@/utils/encoding'

export const NODE_TYPE_BYTE_LENGTH = 1
export const NODE_ID_BYTE_LENGTH = 5
export const PATCH_TYPE_BYTE_LENGTH = 1

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
