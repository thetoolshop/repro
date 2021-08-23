import { SyntheticId } from '@/types/common'
import { Immutable } from '@/types/extensions'

import {
  createSyntheticId,
  getNodeId,
  insertSubTreesAtNode,
  isDocumentVNode,
  isElementVNode,
} from '@/utils/vdom'

import {
  NodeType,
  Patch,
  PatchType,
  VNode,
  VText,
  VTree,
} from '@/types/vdom'

import { ObserverLike, RecordingOptions } from '../types'

import {
  isDetachedNode,
  isDocTypeNode,
  isDocumentFragmentNode,
  isDocumentNode,
  isElementNode,
  isExternalStyleSheet,
  isIFrameElement,
  isLocalStylesheet,
  isScriptElement,
  isTextNode,
} from './utils'

import {
  createVDocument,
  createVDocType,
  createVElement,
  createVText,
  createStyleSheetVTree,
} from './factory'

export function buildVTreeSnapshot(doc: Document, options: RecordingOptions): VTree {
  return createVTree(doc, options)
}

export function observeDOMPatches(doc: Document, vtree: Immutable<VTree>, options: RecordingOptions, subscriber: (patch: Patch) => void): ObserverLike {
  const domObserver = createDOMObserver(doc, options, subscriber)
  const styleSheetObserver = createStyleSheetObserver(doc, vtree, subscriber)
  // TODO: input value + checked state observer

  return {
    disconnect() {
      domObserver.disconnect()
      styleSheetObserver.disconnect()
    }
  }
}

function isIgnoredByNode(node: Node, ignoredNodes: Array<Node> = []) {
  return ignoredNodes.some(ignoredNode => {
    return ignoredNode.contains(node)
  })
}

function isIgnoredBySelector(node: Node, ignoredSelectors: Array<string> = []) {
  return ignoredSelectors.some(selector => {
    const parent = document.querySelector(selector)
    return parent ? parent.contains(node) : false
  })
}

function createVTree(rootNode: Node, options: RecordingOptions): VTree {
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
            vTree = insertSubTreesAtNode(vTree, vNode, [subTree], 0)
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
                vTree = insertSubTreesAtNode(
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

function createDOMObserver(doc: Document, options: RecordingOptions, subscriber: (patch: Patch) => void) {
  const domObserver = new MutationObserver(entries => {
    for (const entry of entries) {
      if (isIgnoredByNode(entry.target, options.ignoredNodes)) {
        continue
      }

      if (isIgnoredBySelector(entry.target, options.ignoredSelectors)) {
        continue
      }

      switch (entry.type) {
        case 'attributes':
          const name = entry.attributeName as string
          const attribute = (entry.target as Element).attributes.getNamedItem(name)

          subscriber({
            type: PatchType.Attribute,
            targetId: getNodeId(entry.target),
            name,
            value: attribute ? attribute.value : null,
            oldValue: entry.oldValue,
          })

          break

        case 'characterData':
          subscriber({
            type: PatchType.Text,
            targetId: getNodeId(entry.target),
            value: (entry.target as Text).data,
            oldValue: entry.oldValue || "",
          })

          break

        case 'childList':
          const addedVTrees = Array.from(entry.addedNodes)
            .filter(node => !isIgnoredBySelector(node, options.ignoredSelectors))
            .filter(node => !isIgnoredByNode(node, options.ignoredNodes))
            .map(node => createVTree(node, options))

          const removedVTrees = Array.from(entry.removedNodes)
            .filter(node => !isIgnoredBySelector(node, options.ignoredSelectors))
            .filter(node => !isIgnoredByNode(node, options.ignoredNodes))
            .map(node => createVTree(node, options))

          if (removedVTrees.length) {
            subscriber({
              type: PatchType.RemoveNodes,
              parentId: getNodeId(entry.target),
              previousSiblingId:
                entry.previousSibling !== null
                  ? getNodeId(entry.previousSibling)
                  : null,
              nextSiblingId:
                entry.nextSibling !== null
                  ? getNodeId(entry.nextSibling)
                  : null,
              nodes: removedVTrees,
            })
          }

          if (addedVTrees.length) {
            subscriber({
              type: PatchType.AddNodes,
              parentId: getNodeId(entry.target),
              previousSiblingId:
                entry.previousSibling !== null
                  ? getNodeId(entry.previousSibling)
                  : null,
              nextSiblingId:
                entry.nextSibling !== null
                  ? getNodeId(entry.nextSibling)
                  : null,
              nodes: addedVTrees,
            })
          }

          break
      }
    }
  })

  domObserver.observe(doc, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true,
  })

  return domObserver
}

function createStyleSheetObserver(doc: Document, vtree: Immutable<VTree>, subscriber: (patch: Patch) => void) {
  function insertRuleEffect(sheet: CSSStyleSheet, rule: string, index: number = 0) {
    if (sheet.ownerNode && doc.contains(sheet.ownerNode)) {
      const parentId = getNodeId(sheet.ownerNode)
      const parentVNode = vtree.nodes[parentId]

      if (parentVNode && isElementVNode(parentVNode)) {
        const previousSiblingId = parentVNode.children[index - 1] || null
        const nextSiblingId = parentVNode.children[index] || null
        const id = createSyntheticId()

        subscriber({
          type: PatchType.AddNodes,
          parentId,
          previousSiblingId,
          nextSiblingId,
          nodes: [{
            rootId: id,
            nodes: {
              [id]: {
                type: NodeType.Text,
                id,
                value: rule,
              },
            },
          }]
        })
      }
    }
  }

  const insertRule = window.CSSStyleSheet.prototype.insertRule
  window.CSSStyleSheet.prototype.insertRule = function(this, ...args) {
    console.log('insert rule', this, args)
    insertRuleEffect(this, ...args)
    return insertRule.call(this, ...args)
  }

  function deleteRuleEffect(sheet: CSSStyleSheet, index: number) {
    if (sheet.ownerNode && doc.contains(sheet.ownerNode)) {
      const parentId = getNodeId(sheet.ownerNode)
      const parentVNode = vtree.nodes[parentId]

      if (parentVNode && isElementVNode(parentVNode)) {
        const previousSiblingId = parentVNode.children[index - 1] || null
        const nextSiblingId = parentVNode.children[index + 1] || null
        const id = parentVNode.children[index]

        if (id) {
          const node = vtree.nodes[id]

          if (node) {
            subscriber({
              type: PatchType.RemoveNodes,
              parentId,
              previousSiblingId,
              nextSiblingId,
              nodes: [{
                rootId: id,
                nodes: {
                  [id]: node as VText,
                },
              }]
            })
          }
        }
      }
    }
  }

  const deleteRule = window.CSSStyleSheet.prototype.deleteRule
  window.CSSStyleSheet.prototype.deleteRule = function(this, ...args) {
    deleteRuleEffect(this, ...args)
    return deleteRule.call(this, ...args)
  }

  return {
    disconnect() {
      window.CSSStyleSheet.prototype.insertRule = insertRule
      window.CSSStyleSheet.prototype.deleteRule = deleteRule
    }
  }
}
