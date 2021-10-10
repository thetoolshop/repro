import { nanoid } from 'nanoid'
import { Stats } from '@/libs/diagnostics'
import { SyntheticId } from '@/types/common'
import { Immutable } from '@/types/extensions'
import { NodeType, Patch, PatchType, VDocType, VDocument, VElement, VNode, VText, VTree } from '@/types/vdom'
import { copyObjectDeep } from '@/utils/lang'

export function createSyntheticId() {
  return nanoid(5)
}

function createNodeIdFactory() {
  const nodeIds = new WeakMap<Node, SyntheticId>()

  return {
    hasNodeId(node: Node) {
      return nodeIds.has(node)
    },

    getNodeId(node: Node) {
      if (nodeIds.has(node)) {
        return nodeIds.get(node) as string
      }

      const nodeId = createSyntheticId()

      nodeIds.set(node, nodeId)

      return nodeId
    }
  }
}

export const { getNodeId, hasNodeId } = createNodeIdFactory()

export function getNodeIds(nodes: NodeList) {
  const queue = Array.from(nodes)
  const nodeIds: Array<SyntheticId> = []

  let node: Node | undefined

  while (node = queue.shift()) {
    if (hasNodeId(node)) {
      queue.push(...Array.from(node.childNodes))
      nodeIds.push(getNodeId(node))
    }
  }

  return nodeIds
}

export function isDocumentVNode(node: VNode | Immutable<VNode>): node is VDocument | Immutable<VDocument> {
  return node.type === NodeType.Document
}

export function isDocTypeVNode(node: VNode | Immutable<VNode>): node is VDocType | Immutable<VDocType> {
  return node.type === NodeType.DocType
}

export function isElementVNode(node: VNode | Immutable<VNode>): node is VElement | Immutable<VElement> {
  return node.type === NodeType.Element
}

export function isStyleElementVNode(node: VNode | Immutable<VNode>) {
  return isElementVNode(node) && node.tagName === 'style'
}

export function isTextVNode(node: VNode | Immutable<VNode>): node is VText | Immutable<VText> {
  return node.type === NodeType.Text
}

export function getVNodeById(vtree: VTree, nodeId: SyntheticId): VNode | null {
  return vtree.nodes[nodeId] ?? null
}

export function replaceVNodeById(vtree: VTree, nodeId: SyntheticId, newNode: VNode) {
  vtree.nodes[nodeId] = newNode
}

export function insertSubTreesAtNode(vtree: VTree, parent: VElement, subtrees: Array<VTree>, index: number) {
  const childIds: Array<SyntheticId> = []

  for (const subtree of subtrees) {
    childIds.push(subtree.rootId)
    vtree.nodes = {
      ...vtree.nodes,
      ...copyObjectDeep(subtree.nodes),
    }
  }

  parent.children.splice(index, 0, ...childIds)
}

export function removeSubTreesAtNode(vtree: VTree, parent: VElement, subtrees: Array<VTree>) {
  const childIds: Array<SyntheticId> = []

  for (const subtree of subtrees) {
    childIds.push(subtree.rootId)

    const queue = [subtree.rootId]

    while (queue.length) {
      const nodeId = queue.shift() as SyntheticId
      const node = getVNodeById(vtree, nodeId)

      if (node) {
        delete vtree.nodes[nodeId]

        if (isElementVNode(node)) {
          queue.push(...node.children)
        }
      }
    }
  }

  let i = parent.children.length

  while (i--) {
    const childId = parent.children[i]

    if (childId && childIds.indexOf(childId) !== -1) {
      parent.children.splice(i, 1)
    }
  }
}

// TODO: benchmark performance of mutable data structure
export function applyVTreePatch(vtree: VTree, patch: Patch, revert: boolean = false): void {
  const start = performance.now()

  switch (patch.type) {
    case PatchType.Attribute: {
      let node = getVNodeById(vtree, patch.targetId)

      if (node && isElementVNode(node)) {
        node.attributes[patch.name] = revert
          ? patch.oldValue
          : patch.value
        Stats.sample('VDOM: apply attribute patch', performance.now() - start)
      }

      break
    }

    case PatchType.Text: {
      let node = getVNodeById(vtree, patch.targetId)

      if (node && isTextVNode(node)) {
        node.value = revert ? patch.oldValue : patch.value
        Stats.sample('VDOM: apply text patch', performance.now() - start)
      }

      break
    }

    case PatchType.AddNodes: {
      let parent = getVNodeById(vtree, patch.parentId)

      if (parent && isElementVNode(parent)) {
        if (revert) {
          removeSubTreesAtNode(vtree, parent, patch.nodes)
        } else {
          const index = patch.previousSiblingId
            ? parent.children.indexOf(patch.previousSiblingId) + 1
            : 0

          insertSubTreesAtNode(vtree, parent, patch.nodes, index)
        }

        Stats.sample('VDOM: apply add-nodes patch', performance.now() - start)
      }

      break
    }

    case PatchType.RemoveNodes: {
      let parent = getVNodeById(vtree, patch.parentId)

      if (parent && isElementVNode(parent)) {
        if (revert) {
          const index = patch.previousSiblingId
            ? parent.children.indexOf(patch.previousSiblingId)
            : 0

          insertSubTreesAtNode(vtree, parent, patch.nodes, index)
        } else {
          removeSubTreesAtNode(vtree, parent, patch.nodes)
        }

        Stats.sample('VDOM: apply remove-nodes patch', performance.now() - start)
      }

      break
    }
  }
}
