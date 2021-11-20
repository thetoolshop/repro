import { VTree } from '@/types/vdom'

import {
  isDocTypeNode,
  isDocumentNode,
  isDocumentFragmentNode,
  isElementNode,
  isIFrameElement,
  isScriptElement,
  isTextNode,
} from '@/utils/dom'

import { DOMOptions, Visitor } from '../types'

function walkDOMTree(
  root: Node,
  domVisitor: Visitor<VTree>,
  passiveVisitors: Array<Visitor<any>>,
  options: DOMOptions
) {
  const visitors = [domVisitor, ...passiveVisitors]
  const queue = [root]

  let node: Node | undefined

  while ((node = queue.shift())) {
    if (isIgnoredByNode(node, options.ignoredNodes)) {
      continue
    }

    if (isIgnoredBySelector(node, options.ignoredSelectors)) {
      continue
    }

    if (isElementNode(node)) {
      if (isScriptElement(node)) {
        continue
      }

      for (const visitor of visitors) {
        visitor.elementNode(node)
      }

      if (isIFrameElement(node) && node.contentDocument) {
        queue.push(node.contentDocument)
      }
    } else if (isTextNode(node)) {
      for (const visitor of visitors) {
        visitor.textNode(node)
      }
    } else if (isDocumentFragmentNode(node)) {
      for (const visitor of visitors) {
        visitor.documentFragmentNode(node)
      }
    } else if (isDocumentNode(node)) {
      for (const visitor of visitors) {
        visitor.documentNode(node)
      }
    } else if (isDocTypeNode(node)) {
      for (const visitor of visitors) {
        visitor.documentTypeNode(node)
      }
    }

    queue.push(...Array.from(node.childNodes))
  }

  for (const visitor of passiveVisitors) {
    visitor.done()
  }

  return domVisitor.done()
}

export interface DOMTreeWalker {
  (root: Node): VTree | null
  accept(visitor: Visitor<any>): void
  acceptDOMVisitor(visitor: Visitor<VTree>): void
}

export function createDOMTreeWalker(options: DOMOptions): DOMTreeWalker {
  let domVisitor: Visitor<VTree> | null = null
  const passiveVisitors: Array<Visitor<any>> = []

  const walk = (root: Node) => {
    if (!domVisitor) {
      throw new Error('DOMTreeWalker: missing DOM visitor')
    }

    return walkDOMTree(root, domVisitor, passiveVisitors, options)
  }

  walk.acceptDOMVisitor = (visitor: Visitor<VTree>) => {
    domVisitor = visitor
  }

  walk.accept = (visitor: Visitor<any>) => {
    passiveVisitors.push(visitor)
  }

  return walk
}

export function isIgnoredByNode(node: Node, ignoredNodes: Array<Node> = []) {
  return ignoredNodes.some(ignoredNode => {
    return ignoredNode.contains(node)
  })
}

export function isIgnoredBySelector(
  node: Node,
  ignoredSelectors: Array<string> = []
) {
  return ignoredSelectors.some(selector => {
    const parent = document.querySelector(selector)
    return parent ? parent.contains(node) : false
  })
}
