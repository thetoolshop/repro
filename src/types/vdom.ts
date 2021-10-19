import type { SyntheticId } from './common'

export enum NodeType {
  DocType  = 0,
  Document = 1,
  Element  = 2,
  Text     = 3,
}

export interface VDocType {
  id: SyntheticId
  type: NodeType.DocType
  name: string
  publicId: string
  systemId: string
}

export interface VDocument {
  id: SyntheticId
  type: NodeType.Document
  children: Array<SyntheticId>
}

export interface VElement {
  id: SyntheticId
  type: NodeType.Element
  tagName: string
  attributes: Record<string, string | null>
  children: Array<SyntheticId>
}

export interface VText {
  id: SyntheticId
  type: NodeType.Text
  value: string
}

export type VNode =
  | VDocument
  | VDocType
  | VElement
  | VText

export interface VTree {
  rootId: SyntheticId
  nodes: Record<SyntheticId, VNode>
}

export enum PatchType {
  Attribute   = 0,
  Text        = 1,
  AddNodes    = 2,
  RemoveNodes = 3,
}

export interface AttributePatch {
  type: PatchType.Attribute
  targetId: SyntheticId
  name: string
  value: string | null
  oldValue: string | null
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
  | TextPatch
  | AddNodesPatch
  | RemoveNodesPatch
