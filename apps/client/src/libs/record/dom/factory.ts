import {
  isInlineEventAttribute,
  isInputElement,
  isSelectElement,
  isTextAreaElement,
} from '@/utils/dom'
import {
  NodeType,
  SyntheticId,
  VDocument,
  VDocType,
  VElement,
  VText,
  VTree,
} from '@repro/domain'
import { createSyntheticId, getNodeId } from '@/utils/vdom'

export function createVDocument(doc: Document): VDocument {
  return {
    id: getNodeId(doc),
    parentId: doc.parentNode ? getNodeId(doc.parentNode) : null,
    type: NodeType.Document,
    children: [],
  }
}

export function createVDocType(doctype: DocumentType): VDocType {
  return {
    id: getNodeId(doctype),
    parentId: doctype.parentNode ? getNodeId(doctype.parentNode) : null,
    type: NodeType.DocType,
    name: doctype.name,
    publicId: doctype.publicId,
    systemId: doctype.systemId,
  }
}

export function createVElement(
  element: Element,
  attributeOverrides?: Record<string, string>
): VElement {
  const attributes =
    attributeOverrides ??
    Array.from(element.attributes)
      .filter(({ name }) => !isInlineEventAttribute(name))
      .reduce((attrs, { name, value }) => ({ ...attrs, [name]: value }), {})

  const properties: VElement['properties'] = {}

  if (
    isInputElement(element) ||
    isTextAreaElement(element) ||
    isSelectElement(element)
  ) {
    properties.value = element.value
  }

  if (
    isInputElement(element) &&
    (element.type === 'checkbox' || element.type === 'radio')
  ) {
    properties.checked = element.checked
  }

  if (isSelectElement(element)) {
    properties.selectedIndex = element.selectedIndex
  }

  // TODO: check if element is shadow root

  return {
    id: getNodeId(element),
    parentId: element.parentNode ? getNodeId(element.parentNode) : null,
    type: NodeType.Element,
    tagName: element.nodeName.toLowerCase(),
    attributes,
    properties,
    children: [],
  }
}

export function createVText(text: Text): VText {
  return {
    id: getNodeId(text),
    parentId: text.parentNode ? getNodeId(text.parentNode) : null,
    type: NodeType.Text,
    value: text.data,
  }
}

export function createStyleSheetVTree(
  node: HTMLStyleElement | HTMLLinkElement
): VTree | null {
  if (!node.sheet) {
    return null
  }

  const rootId = getNodeId(node)
  const parentId = node.parentNode ? getNodeId(node.parentNode) : null
  const children: Array<SyntheticId> = []

  const vTree: VTree = {
    rootId,
    nodes: {},
  }

  for (const rule of Array.from(node.sheet.cssRules)) {
    const childId = createSyntheticId()

    vTree.nodes[childId] = {
      id: childId,
      parentId: rootId,
      type: NodeType.Text,
      value: rule.cssText,
    }

    children.push(childId)
  }

  const attributes: Record<string, string | null> = {}

  if (node.hasAttribute('media')) {
    attributes.media = node.getAttribute('media')
  }

  vTree.nodes[rootId] = {
    id: rootId,
    parentId,
    type: NodeType.Element,
    tagName: 'style',
    attributes,
    properties: {},
    children,
  }

  return vTree
}
