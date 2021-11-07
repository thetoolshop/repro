import { SyntheticId } from '@/types/common'
import { isInlineEventAttribute } from '@/utils/dom'
import { NodeType, VDocument, VDocType, VElement, VText, VTree } from '@/types/vdom'
import { createSyntheticId, getNodeId } from '@/utils/vdom'

export function createVDocument(doc: Document): VDocument {
  return {
    id: getNodeId(doc),
    type: NodeType.Document,
    children: []
  }
}

export function createVDocType(doctype: DocumentType): VDocType {
  return {
    id: getNodeId(doctype),
    type: NodeType.DocType,
    name: doctype.name,
    publicId: doctype.publicId,
    systemId: doctype.systemId,
  }
}

export function createVElement(element: Element, attributeOverrides?: Record<string, string>): VElement {
  const attributes = attributeOverrides ?? Array.from(element.attributes)
    .filter(({ name }) => !isInlineEventAttribute(name))
    .reduce((attrs, { name, value }) => ({ ...attrs, [name]: value }), {})

  // TODO: check if element is shadow root

  return {
    id: getNodeId(element),
    type: NodeType.Element,
    tagName: element.nodeName.toLowerCase(),
    attributes,
    children: [],
  }
}

export function createVText(text: Text): VText {
  return {
    id: getNodeId(text),
    type: NodeType.Text,
    value: text.data,
  }
}

export function createStyleSheetVTree(node: HTMLStyleElement | HTMLLinkElement): VTree | null {
  if (!node.sheet) {
    return null
  }

  const parentId = getNodeId(node)
  const children: Array<SyntheticId> = []

  const vTree: VTree = {
    rootId: parentId,
    nodes: {},
  }

  for (const rule of Array.from(node.sheet.cssRules)) {
    const childId = createSyntheticId()

    vTree.nodes[childId] = {
      id: childId,
      type: NodeType.Text,
      value: rule.cssText,
    }

    children.push(childId)
  }

  vTree.nodes[parentId] = {
    id: parentId,
    type: NodeType.Element,
    tagName: 'style',
    attributes: {},
    children,
  }

  return vTree
}

