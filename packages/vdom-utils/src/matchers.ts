import {
  NodeType,
  VDocType,
  VDocument,
  VElement,
  VNode,
  VText,
} from '@repro/domain'
import { Immutable } from '@repro/ts-utils'

export function isDocumentVNode(
  node: VNode | Immutable<VNode>
): node is VDocument | Immutable<VDocument> {
  return node.type === NodeType.Document
}

export function isDocTypeVNode(
  node: VNode | Immutable<VNode>
): node is VDocType | Immutable<VDocType> {
  return node.type === NodeType.DocType
}

export function isElementVNode(
  node: VNode | Immutable<VNode>
): node is VElement | Immutable<VElement> {
  return node.type === NodeType.Element
}

// https://developer.mozilla.org/en-US/docs/Glossary/Empty_element
const EMPTY_ELEMENT_NAMES = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]

export function isEmptyElementVNode(node: VNode | Immutable<VNode>) {
  return isElementVNode(node) && EMPTY_ELEMENT_NAMES.includes(node.tagName)
}

export function isStyleElementVNode(node: VNode | Immutable<VNode>) {
  return isElementVNode(node) && node.tagName === 'style'
}

export function isTextVNode(node: VNode): node is VText {
  return node.type === NodeType.Text
}
