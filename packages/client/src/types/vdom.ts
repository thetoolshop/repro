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
