import type { SyntheticId } from './common'

export enum NodeType {
  Element = 'element',
  Text    = 'text',
}

export interface VElement {
  id: SyntheticId
  type: NodeType.Element
  tagName: string
  attributes: Record<string, string>
  children: Array<SyntheticId>
}

export interface VText {
  id: SyntheticId
  type: NodeType.Text
  value: string
}

export type VNode = VElement | VText

export interface VTree {
  rootId: SyntheticId
  nodes: Record<SyntheticId, VNode>
}

export enum PatchType {
  Attribute   = 'attribute',
  Text        = 'text',
  AddNodes    = 'add-nodes',
  RemoveNodes = 'remove-nodes',
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
