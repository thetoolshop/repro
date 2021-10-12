import { Stats } from '@/libs/diagnostics'
import { Immutable } from '@/types/extensions'

import {
  createSyntheticId,
  getNodeId,
  isElementVNode,
} from '@/utils/vdom'

import {
  NodeType,
  Patch,
  PatchType,
  VText,
  VTree,
} from '@/types/vdom'

import { ObserverLike, RecordingOptions } from '../types'
import { createVTree } from './factory'
import { isIgnoredByNode, isIgnoredBySelector } from './utils'

export function buildVTreeSnapshot(doc: Document, options: RecordingOptions): VTree {
  const start = performance.now()
  const vtree = createVTree(doc, options)
  Stats.emit('DOM: build snapshot', performance.now() - start)
  return vtree
}

export function observeDOMPatches(doc: Document, vtree: Immutable<VTree>, options: RecordingOptions, subscriber: (patch: Patch) => void): ObserverLike {
  const channel = new BroadcastChannel('repro:page-context')
  const domObserver = createDOMObserver(doc, options, subscriber)
  const styleSheetObserver = createStyleSheetObserver(doc, vtree, subscriber)
  // TODO: input value + checked state observer

  return {
    disconnect() {
      channel.close()
      domObserver.disconnect()
      styleSheetObserver.disconnect()
    }
  }
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
            oldValue: entry.oldValue || '',
          })

          break

        case 'childList':
          // TODO: optimization - handle moving nodes without destroying vnode
          const removedVTrees = Array.from(entry.removedNodes)
            .filter(node => !isIgnoredBySelector(node, options.ignoredSelectors))
            .filter(node => !isIgnoredByNode(node, options.ignoredNodes))
            .map(node => createVTree(node, options))

          const addedVTrees = Array.from(entry.addedNodes)
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
