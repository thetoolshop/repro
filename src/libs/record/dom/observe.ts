import { SyntheticId } from '@/types/common'
import { Immutable } from '@/types/extensions'
import { NodeType, Patch, PatchType, VText, VTree } from '@/types/vdom'
import { createSyntheticId, getNodeId, isElementVNode } from '@/utils/vdom'
import { ObserverLike, RecordingOptions } from '../types'
import { DOMTreeWalker, isIgnoredByNode, isIgnoredBySelector } from './utils'

export function createDOMObserver(
  walkDOMTree: DOMTreeWalker,
  options: RecordingOptions,
  subscriber: (patch: Patch) => void
): ObserverLike {
  const domObserver = createMutationObserver(walkDOMTree, options, subscriber)
  const styleSheetObserver = createStyleSheetObserver(subscriber)
  // TODO: input value + checked state observer (should this be interaction? or is 'form' a distinct recording type?)

  return {
    disconnect() {
      domObserver.disconnect()
      styleSheetObserver.disconnect()
    },

    observe(doc, vtree) {
      domObserver.observe(doc, vtree)
      styleSheetObserver.observe(doc, vtree)
    },
  }
}

function createMutationObserver(
  walkDOMTree: DOMTreeWalker,
  options: RecordingOptions,
  subscriber: (patch: Patch) => void
): ObserverLike<Document> {
  const domObserver = new MutationObserver(entries => {
    const addedNodeIds = new Set<SyntheticId>()
    const removedNodeIds = new Set<SyntheticId>()

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
          const attribute = (entry.target as Element).attributes.getNamedItem(
            name
          )

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
            .filter(node => !removedNodeIds.has(getNodeId(node)))
            .filter(
              node => !isIgnoredBySelector(node, options.ignoredSelectors)
            )
            .filter(node => !isIgnoredByNode(node, options.ignoredNodes))
            .map(node => walkDOMTree(node))
            .filter(vtree => vtree !== null) as Array<VTree>

          const addedVTrees = Array.from(entry.addedNodes)
            .filter(node => !addedNodeIds.has(getNodeId(node)))
            .filter(
              node => !isIgnoredBySelector(node, options.ignoredSelectors)
            )
            .filter(node => !isIgnoredByNode(node, options.ignoredNodes))
            .map(node => walkDOMTree(node))
            .filter(vtree => vtree !== null) as Array<VTree>

          if (removedVTrees.length) {
            for (const vtree of removedVTrees) {
              for (const nodeId of Object.keys(vtree.nodes)) {
                removedNodeIds.add(nodeId)
              }
            }

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
            for (const vtree of addedVTrees) {
              for (const nodeId of Object.keys(vtree.nodes)) {
                addedNodeIds.add(nodeId)
              }
            }

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

  return {
    disconnect: () => domObserver.disconnect(),
    observe(doc) {
      domObserver.observe(doc, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        characterDataOldValue: true,
      })
    },
  }
}

function createStyleSheetObserver(
  subscriber: (patch: Patch) => void
): ObserverLike<Document> {
  function insertRuleEffect(
    doc: Document,
    vtree: Immutable<VTree>,
    sheet: CSSStyleSheet,
    rule: string,
    index: number = 0
  ) {
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
          nodes: [
            {
              rootId: id,
              nodes: {
                [id]: {
                  type: NodeType.Text,
                  id,
                  value: rule,
                },
              },
            },
          ],
        })
      }
    }
  }

  function deleteRuleEffect(
    doc: Document,
    vtree: Immutable<VTree>,
    sheet: CSSStyleSheet,
    index: number
  ) {
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
              nodes: [
                {
                  rootId: id,
                  nodes: {
                    [id]: node as VText,
                  },
                },
              ],
            })
          }
        }
      }
    }
  }

  const insertRule = window.CSSStyleSheet.prototype.insertRule
  const deleteRule = window.CSSStyleSheet.prototype.deleteRule

  return {
    disconnect() {
      window.CSSStyleSheet.prototype.insertRule = insertRule
      window.CSSStyleSheet.prototype.deleteRule = deleteRule
    },

    observe(doc, vtree) {
      window.CSSStyleSheet.prototype.insertRule = function (this, ...args) {
        insertRuleEffect(doc, vtree, this, ...args)
        return insertRule.call(this, ...args)
      }

      window.CSSStyleSheet.prototype.deleteRule = function (this, ...args) {
        deleteRuleEffect(doc, vtree, this, ...args)
        return deleteRule.call(this, ...args)
      }
    },
  }
}
