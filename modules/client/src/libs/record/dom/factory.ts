import { SyntheticId } from '@/types/common'

import {
  NodeType,
  VDocument,
  VDocType,
  VElement,
  VNode,
  VText,
  VTree,
} from '@/types/vdom'

import {
  createSyntheticId,
  getNodeId,
  insertSubTreesAtNode,
  isDocumentVNode,
  isElementVNode,
} from '@/utils/vdom'

import { RecordingOptions } from '../types'

import {
  isDetachedNode,
  isDocTypeNode,
  isDocumentFragmentNode,
  isDocumentNode,
  isElementNode,
  isExternalStyleSheet,
  isIFrameElement,
  isIgnoredByNode,
  isIgnoredBySelector,
  isInlineEventAttribute,
  isLocalStylesheet,
  isScriptElement,
  isTextNode,
} from './utils'

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

export function createVTree(rootNode: Node, options: RecordingOptions): VTree {
  /**
   * TODO
   * [x] Flatten DocumentFragment nodes
   * [x] Exclude scripts
   * [x] Attempt to inline external stylesheets (as list of text nodes)
   * [ ] Flatten CSS import rules
   * [x] Insert cross-origin stylesheets as-is
   * [x] Strip inline event listeners
   * [x] Build nested VTree for same-origin iframes
   * [ ] Build nested VTree for Shadow DOM
   * [ ] Convert same-origin images to data-uris
   * [ ] Convert cross-origin images to data-uris via extension proxy
   */

  let vTree: VTree = {
    rootId: getNodeId(rootNode),
    nodes: {},
  }

  const queue = [rootNode]

  let node: Node | undefined

  while (node = queue.shift()) {
    let vNode: VNode | null = null

    if (isDetachedNode(node)) {
      continue
    }

    if (isIgnoredByNode(node, options.ignoredNodes)) {
      continue
    }

    if (isIgnoredBySelector(node, options.ignoredSelectors)) {
      continue
    }

    if (isDocumentFragmentNode(node)) {
      queue.push(...Array.from(node.childNodes))
      continue
    }

    if (isDocumentNode(node)) {
      vNode = createVDocument(node)
    }

    if (isDocTypeNode(node)) {
      vNode = createVDocType(node)
    }

    if (isElementNode(node)) {
      if (isScriptElement(node)) {
        continue
      }

      if (isIFrameElement(node)) {
        const frameDoc = node.contentDocument

        if (frameDoc && node.parentNode) {
          const parentId = getNodeId(node.parentNode)
          const parentNode = vTree.nodes[parentId]

          if (parentNode && isElementVNode(parentNode)) {
            vNode = createVElement(node, {})
            parentNode.children.push(vNode.id)
            vTree.nodes[vNode.id] = vNode

            const subTree = createVTree(frameDoc, options)
            insertSubTreesAtNode(vTree, vNode, [subTree], 0)
          }
        }

        continue
      }

      if (isLocalStylesheet(node) || isExternalStyleSheet(node)) {
        if (node.parentNode) {
          const parentId = getNodeId(node.parentNode)
          const parentVNode = vTree.nodes[parentId]

          if (parentVNode && isElementVNode(parentVNode)) {
            try {
              const subTree = createStyleSheetVTree(node)

              if (subTree) {
                insertSubTreesAtNode(
                  vTree,
                  parentVNode,
                  [subTree],
                  parentVNode.children.length
                )
                continue
              }
            } catch {}
          }
        }
      }

      if (!vNode) {
        vNode = createVElement(node)
      }
    } else if (isTextNode(node)) {
      vNode = createVText(node)
    }

    if (vNode !== null) {
      if (node.parentNode) {
        const parentId = getNodeId(node.parentNode)
        const parentNode = vTree.nodes[parentId]

        if (parentNode && (isElementVNode(parentNode) || isDocumentVNode(parentNode))) {
          parentNode.children.push(vNode.id)
        }
      }

      vTree.nodes[vNode.id] = vNode
    }

    queue.push(...Array.from(node.childNodes))
  }

  return vTree
}
