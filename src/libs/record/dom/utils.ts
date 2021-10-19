import { VTree } from '@/types/vdom'
import { DOMOptions, Visitor } from '../types'

function walkDOMTree(
  root: Node,
  domVisitor: Visitor<VTree>,
  passiveVisitors: Array<Visitor<any>>,
  options: DOMOptions,
) {
  const visitors = [domVisitor, ...passiveVisitors]
  const queue = [root]

  let node: Node | undefined

  while (node = queue.shift()) {
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
    }

    else if (isTextNode(node)) {
      for (const visitor of visitors) {
        visitor.textNode(node)
      }
    }

    else if (isDocumentFragmentNode(node)) {
      for (const visitor of visitors) {
        visitor.documentFragmentNode(node)
      }
    }

    else if (isDocumentNode(node)) {
      for (const visitor of visitors) {
        visitor.documentNode(node)
      }
    }

    else if (isDocTypeNode(node)) {
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

export function isIgnoredBySelector(node: Node, ignoredSelectors: Array<string> = []) {
  return ignoredSelectors.some(selector => {
    const parent = document.querySelector(selector)
    return parent ? parent.contains(node) : false
  })
}

function matches(actual: string, expected: string) {
  return new RegExp(`^${expected}$`, 'i').test(actual)
}

export function isDetachedNode(node: Node) {
  return !node.isConnected
}

export function isDocumentNode(node: Node): node is Document {
  return node.nodeType === Node.DOCUMENT_NODE
}

export function isDocTypeNode(node: Node): node is DocumentType {
  return node.nodeType === Node.DOCUMENT_TYPE_NODE
}

export function isDocumentFragmentNode(node: Node): node is DocumentFragment {
  return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE
}

export function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

export function isIFrameElement(element: Element): element is HTMLIFrameElement {
  return matches(element.nodeName, 'iframe')
}

export function isLocalStylesheet(element: Element): element is HTMLStyleElement {
  return matches(element.nodeName, 'style')
}

export function isExternalStyleSheet(element: Element): element is HTMLLinkElement {
  if (matches(element.nodeName, 'link')) {
    if ((element as HTMLLinkElement).relList.contains('stylesheet')) {
      return true
    }
  }

  return false
}

export function isScriptElement(element: Element): element is HTMLScriptElement {
  return matches(element.nodeName, 'script')
}

export function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE
}

export function isCSSImportRule(rule: CSSRule): rule is CSSImportRule {
  return rule.constructor.name === 'CSSImportRule'
}

const inlineEventAttributes = new Set([
  'onabort',
  'onanimationcancel',
  'onanimationend',
  'onanimationiteration',
  'onanimationstart',
  'onauxclick',
  'onblur',
  'oncancel',
  'oncanplay',
  'oncanplaythrough',
  'onchange',
  'onclick',
  'onclose',
  'oncontextmenu',
  'oncuechange',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragexit',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onemptied',
  'onended',
  'onerror',
  'onfocus',
  'ongotpointercapture',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onload',
  'onloadeddata',
  'onloadedmetadata',
  'onloadstart',
  'onlostpointercapture',
  'onmousedown',
  'onmouseenter',
  'onmouseleave',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onpause',
  'onplay',
  'onplaying',
  'onpointercancel',
  'onpointerdown',
  'onpointerenter',
  'onpointerleave',
  'onpointermove',
  'onpointerout',
  'onpointerover',
  'onpointerup',
  'onprogress',
  'onratechange',
  'onreset',
  'onresize',
  'onscroll',
  'onsecuritypolicyviolation',
  'onseeked',
  'onseeking',
  'onselect',
  'onselectionchange',
  'onselectstart',
  'onstalled',
  'onsubmit',
  'onsuspend',
  'ontimeupdate',
  'ontoggle',
  'ontouchcancel',
  'ontouchend',
  'ontouchmove',
  'ontouchstart',
  'ontransitioncancel',
  'ontransitionend',
  'ontransitionrun',
  'ontransitionstart',
  'onvolumechange',
  'onwaiting',
  'onwheel',
])

export function isInlineEventAttribute(name: string) {
  return inlineEventAttributes.has(name)
}
