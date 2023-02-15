import { randomString } from '@repro/random-string'
import {
  CharDescriptor,
  createView,
  StructDescriptor,
  UINT8,
  UnionDescriptor,
} from '@repro/typed-binary-encoder'
import z from 'zod'

export const NODE_TYPE_BYTE_LENGTH = 1
export const PATCH_TYPE_BYTE_LENGTH = 1

// type NodeType: enum {
//   DocType
//   Document
//   Element
//   Text
// }

export enum NodeType {
  DocType = 0,
  Document = 1,
  Element = 2,
  Text = 3,
}

export const NodeTypeSchema = z.nativeEnum(NodeType)

export function createNodeId() {
  return randomString(NODE_ID_BYTE_LENGTH)
}

// type NodeId: char[5]
export const NODE_ID_BYTE_LENGTH = 5
export const NodeIdSchema = z.string().length(NODE_ID_BYTE_LENGTH)
export type NodeId = z.infer<typeof NodeIdSchema>
export const NodeIdView = createView<NodeId, CharDescriptor>(
  {
    type: 'char',
    bytes: NODE_ID_BYTE_LENGTH,
  },
  NodeIdSchema
)

// type VDocType: struct {
//   type: NodeType.DocType
//   id: NodeId
//   parentId?: NodeId
//   name: string
//   publicId: string
//   systemId: string
// }

export const VDocTypeSchema = z.object({
  id: NodeIdSchema,
  parentId: NodeIdSchema.nullable(),
  type: z.literal(NodeType.DocType),
  name: z.string(),
  publicId: z.string(),
  systemId: z.string(),
})

export type VDocType = z.infer<typeof VDocTypeSchema>

export const VDocTypeView = createView<VDocType, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['id', NodeIdView.descriptor],
      ['parentId', NodeIdView.nullable().descriptor],
      ['name', { type: 'string' }],
      ['publicId', { type: 'string' }],
      ['systemId', { type: 'string' }],
    ],
  },
  VDocTypeSchema
)

// type VDocument: struct {
//   type: NodeType.Document
//   id: NodeId
//   parentId?: NodeId
//   children: vector<NodeId>
// }

export const VDocumentSchema = z.object({
  id: NodeIdSchema,
  parentId: NodeIdSchema.nullable(),
  type: z.literal(NodeType.Document),
  children: z.array(NodeIdSchema),
})

export type VDocument = z.infer<typeof VDocumentSchema>

export const VDocumentView = createView<VDocument, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['id', NodeIdView.descriptor],
      ['parentId', NodeIdView.nullable().descriptor],
      ['children', { type: 'vector', items: NodeIdView.descriptor }],
    ],
  },
  VDocumentSchema
)

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

export const VElementSchema = z.object({
  id: NodeIdSchema,
  parentId: NodeIdSchema.nullable(),
  type: z.literal(NodeType.Element),
  tagName: z.string(),
  attributes: z.record(z.string(), z.string().nullable()),
  properties: z.object({
    value: z.string().nullable(),
    checked: z.boolean().nullable(),
    selectedIndex: z
      .number()
      .min(0)
      .max(2 ** 16 - 1)
      .nullable(),
  }),
  children: z.array(NodeIdSchema),
})

export type VElement = z.infer<typeof VElementSchema>

export const VElementView = createView<VElement, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['id', NodeIdView.descriptor],
      ['parentId', NodeIdView.nullable().descriptor],
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
  },
  VElementSchema
)

// type VText: struct {
//   type: NodeType.Text
//   id: NodeId
//   parentId?: NodeId
//   value: string
// }

export const VTextSchema = z.object({
  id: NodeIdSchema,
  parentId: NodeIdSchema.nullable(),
  type: z.literal(NodeType.Text),
  value: z.string(),
})

export type VText = z.infer<typeof VTextSchema>

export const VTextView = createView<VText, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['id', NodeIdView.descriptor],
      ['parentId', NodeIdView.nullable().descriptor],
      ['value', { type: 'string' }],
    ],
  },
  VTextSchema
)

// type VNode: union on "type" {
//   VDocument
//   VDocType
//   VElement
//   VText
// }

export const VNodeSchema = z.discriminatedUnion('type', [
  VDocTypeSchema,
  VDocumentSchema,
  VElementSchema,
  VTextSchema,
])

export type VNode = z.infer<typeof VNodeSchema>

export const VNodeView = createView<VNode, UnionDescriptor>(
  {
    type: 'union',
    tagField: 'type',
    descriptors: {
      [NodeType.Document]: VDocumentView.descriptor,
      [NodeType.DocType]: VDocTypeView.descriptor,
      [NodeType.Element]: VElementView.descriptor,
      [NodeType.Text]: VTextView.descriptor,
    },
  },
  VNodeSchema
)

// type VTree: struct {
//   rootId: NodeId
//   nodes: map<NodeId, VNode>
// }

export const VTreeSchema = z.object({
  rootId: NodeIdSchema,
  nodes: z.record(NodeIdSchema, VNodeSchema),
})

export type VTree = z.infer<typeof VTreeSchema>

export const VTreeView = createView<VTree, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['rootId', NodeIdView.descriptor],
      [
        'nodes',
        {
          type: 'dict',
          key: NodeIdView.descriptor,
          value: VNodeView.descriptor,
        },
      ],
    ],
  },
  VTreeSchema
)

// type PatchType: enum {
//   Attribute
//   Text
//   AddNodes
//   RemoveNodes
//   TextProperty
//   NumberProperty
//   BooleanProperty
// }

export enum PatchType {
  Attribute = 0,
  Text = 1,
  AddNodes = 2,
  RemoveNodes = 3,
  TextProperty = 4,
  NumberProperty = 5,
  BooleanProperty = 6,
}

// type AttributePatch: struct {
//   type: PatchType.Attribute
//   targetId: NodeId
//   name: string
//   value?: string
//   oldValue?: string
// }

export const AttributePatchSchema = z.object({
  type: z.literal(PatchType.Attribute),
  targetId: NodeIdSchema,
  name: z.string(),
  value: z.string().nullable(),
  oldValue: z.string().nullable(),
})

export type AttributePatch = z.infer<typeof AttributePatchSchema>

export const AttributePatchView = createView<AttributePatch, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['targetId', NodeIdView.descriptor],
      ['name', { type: 'string' }],
      ['value', { type: 'string', nullable: true }],
      ['oldValue', { type: 'string', nullable: true }],
    ],
  },
  AttributePatchSchema
)

// type TextPatch: struct {
//   type: PatchType.Text
//   targetId: NodeId
//   value: string
//   oldValue: string
// }

export const TextPatchSchema = z.object({
  type: z.literal(PatchType.Text),
  targetId: NodeIdSchema,
  value: z.string(),
  oldValue: z.string(),
})

export type TextPatch = z.infer<typeof TextPatchSchema>

export const TextPatchView = createView<TextPatch, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['targetId', NodeIdView.descriptor],
      ['value', { type: 'string' }],
      ['oldValue', { type: 'string' }],
    ],
  },
  TextPatchSchema
)

// type TextPropertyPatch: struct {
//   type: PatchType.TextProperty
//   targetId: NodeId
//   name: string
//   value: string
//   oldValue: string
// }

export const TextPropertyPatchSchema = z.object({
  type: z.literal(PatchType.TextProperty),
  targetId: NodeIdSchema,
  name: z.string(),
  value: z.string(),
  oldValue: z.string(),
})

export type TextPropertyPatch = z.infer<typeof TextPropertyPatchSchema>

export const TextPropertyPatchView = createView<
  TextPropertyPatch,
  StructDescriptor
>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['targetId', NodeIdView.descriptor],
      ['name', { type: 'string' }],
      ['value', { type: 'string' }],
      ['oldValue', { type: 'string' }],
    ],
  },
  TextPropertyPatchSchema
)

// type NumberPropertyPatch: struct {
//   type: PatchType.NumberProperty
//   targetId: NodeId
//   name: string
//   value: int32
//   oldValue: int32
// }

export const NumberPropertyPatchSchema = z.object({
  type: z.literal(PatchType.NumberProperty),
  targetId: NodeIdSchema,
  name: z.string(),
  value: z
    .number()
    .min(-(2 ** 32 - 1))
    .max(2 ** 32 - 1),
  oldValue: z
    .number()
    .min(-(2 ** 32 - 1))
    .max(2 ** 32 - 1),
})

export type NumberPropertyPatch = z.infer<typeof NumberPropertyPatchSchema>

export const NumberPropertyPatchView = createView<
  NumberPropertyPatch,
  StructDescriptor
>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['targetId', NodeIdView.descriptor],
      ['name', { type: 'string' }],
      ['value', { type: 'integer', signed: true, bits: 32 }],
      ['oldValue', { type: 'integer', signed: true, bits: 32 }],
    ],
  },
  NumberPropertyPatchSchema
)

// type BooleanPropertyPatch: struct {
//   type: PatchType.BooleanProperty
//   targetId: NodeId
//   name: string
//   value: bool
//   oldValue: bool
// }

export const BooleanPropertyPatchSchema = z.object({
  type: z.literal(PatchType.BooleanProperty),
  targetId: NodeIdSchema,
  name: z.string(),
  value: z.boolean(),
  oldValue: z.boolean(),
})

export type BooleanPropertyPatch = z.infer<typeof BooleanPropertyPatchSchema>

export const BooleanPropertyPatchView = createView<
  BooleanPropertyPatch,
  StructDescriptor
>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['targetId', NodeIdView.descriptor],
      ['name', { type: 'string' }],
      ['value', { type: 'bool' }],
      ['oldValue', { type: 'bool' }],
    ],
  },
  BooleanPropertyPatchSchema
)

// type AddNodesPatch: struct {
//   type: PatchType.AddNodes
//   parentId: NodeId
//   previousSiblingId?: NodeId
//   nextSiblingId?: NodeId
//   nodes: vector<VTree>
// }

export const AddNodesPatchSchema = z.object({
  type: z.literal(PatchType.AddNodes),
  parentId: NodeIdSchema,
  previousSiblingId: NodeIdSchema.nullable(),
  nextSiblingId: NodeIdSchema.nullable(),
  nodes: z.array(VTreeSchema),
})

export type AddNodesPatch = z.infer<typeof AddNodesPatchSchema>

export const AddNodesPatchView = createView<AddNodesPatch, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['parentId', NodeIdView.descriptor],
      ['previousSiblingId', NodeIdView.nullable().descriptor],
      ['nextSiblingId', NodeIdView.nullable().descriptor],
      ['nodes', { type: 'vector', items: VTreeView.descriptor }],
    ],
  },
  AddNodesPatchSchema
)

// type RemoveNodesPatch: struct {
//   type: PatchType.RemoveNodes
//   parentId: NodeId
//   previousSiblingId?: NodeId
//   nextSiblingId?: NodeId
//   nodes: vector<VTree>
// }

export const RemoveNodesPatchSchema = z.object({
  type: z.literal(PatchType.RemoveNodes),
  parentId: NodeIdSchema,
  previousSiblingId: NodeIdSchema.nullable(),
  nextSiblingId: NodeIdSchema.nullable(),
  nodes: z.array(VTreeSchema),
})

export type RemoveNodesPatch = z.infer<typeof RemoveNodesPatchSchema>

export const RemoveNodesPatchView = createView<
  RemoveNodesPatch,
  StructDescriptor
>(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['parentId', NodeIdView.descriptor],
      ['previousSiblingId', NodeIdView.nullable().descriptor],
      ['nextSiblingId', NodeIdView.nullable().descriptor],
      ['nodes', { type: 'vector', items: VTreeView.descriptor }],
    ],
  },
  RemoveNodesPatchSchema
)

// type DOMPatch: union {
//   AttributePatch
//   TextPatch
//   TextPropertyPatch
//   NumberPropertyPatch
//   BooleanPropertyPatch
//   AddNodesPatch
//   RemoveNodesPatch
// }

export const DOMPatchSchema = z.discriminatedUnion('type', [
  AttributePatchSchema,
  TextPatchSchema,
  TextPropertyPatchSchema,
  NumberPropertyPatchSchema,
  BooleanPropertyPatchSchema,
  AddNodesPatchSchema,
  RemoveNodesPatchSchema,
])

export type DOMPatch = z.infer<typeof DOMPatchSchema>
// @deprecated
export type Patch = DOMPatch

export const DOMPatchView = createView<Patch, UnionDescriptor>(
  {
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
  },
  DOMPatchSchema
)
