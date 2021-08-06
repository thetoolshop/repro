import { nanoid } from 'nanoid'
import { SyntheticId } from '@/types/common'
import { Immutable } from '@/types/extensions'
import { NodeType, Patch, PatchType, VElement, VNode, VText, VTree } from '@/types/vdom'

import {
  assocPath as assocPathR,
  assoc as assocR,
  insertAll as insertAllR,
  lensPath as lensPathR,
  merge as mergeR,
  set as setR,
  without as withoutR,
} from 'ramda'

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

export function isElementVNode(node: VNode | Immutable<VNode>): node is VElement | Immutable<VElement> {
  return node.type === NodeType.Element
}

export function isTextVNode(node: VNode | Immutable<VNode>): node is VText | Immutable<VText> {
  return node.type === NodeType.Text
}

function getVNodeById(vtree: VTree, nodeId: SyntheticId): VNode | null {
  return vtree.nodes[nodeId] ?? null
}

function replaceVNodeById(vtree: VTree, nodeId: SyntheticId, newNode: VNode) {
  const nodeLens = lensPathR<VTree, VNode>(['nodes', nodeId])
  return setR(nodeLens, newNode, vtree)
}

function insertSubTreesAtNode(vtree: VTree, parent: VElement, subtrees: Array<VTree>, index: number) {
  const childIds: Array<SyntheticId> = []

  for (const subtree of subtrees) {
    childIds.push(subtree.rootId)
    vtree = assocR('nodes', mergeR(vtree.nodes, subtree.nodes), vtree)
  }

  parent = assocR('children', insertAllR(index, childIds, parent.children), parent)
  return replaceVNodeById(vtree, parent.id, parent)
}

function removeSubTreesAtNode(vtree: VTree, parent: VElement, subtrees: Array<VTree>) {
  const childIds: Array<SyntheticId> = []
  const descendentIds: Array<SyntheticId> = []

  for (const subtree of subtrees) {
    childIds.push(subtree.rootId)

    const queue = [subtree.rootId]

    while (queue.length) {
      const nodeId = queue.shift() as SyntheticId
      const node = getVNodeById(vtree, nodeId)

      if (node) {
        descendentIds.push(nodeId)

        if (isElementVNode(node)) {
          queue.push(...node.children)
        }
      }
    }
  }

  parent = assocR('children', withoutR(childIds, parent.children), parent)
  return replaceVNodeById(vtree, parent.id, parent)
}

export function applyVTreePatch(vtree: VTree, patch: Patch, revert: boolean = false): VTree {
  switch (patch.type) {
    case PatchType.Attribute: {
      let node = getVNodeById(vtree, patch.targetId)

      if (node) {
        node = assocPathR(['attributes', patch.name],
          revert ? patch.oldValue : patch.value,
          node)

        return replaceVNodeById(vtree, patch.targetId, node)
      }

      break
    }

    case PatchType.Text: {
      let node = getVNodeById(vtree, patch.targetId)

      if (node && isTextVNode(node)) {
        node = assocR('value', revert ? patch.oldValue : patch.value, node)
        return replaceVNodeById(vtree, patch.targetId, node)
      }

      break
    }

    case PatchType.AddNodes: {
      let parent = getVNodeById(vtree, patch.parentId)

      if (parent && isElementVNode(parent)) {
        const index = patch.previousSiblingId
          ? parent.children.indexOf(patch.previousSiblingId) + 1
          : 0

        return revert
          ? removeSubTreesAtNode(vtree, parent, patch.nodes)
          : insertSubTreesAtNode(vtree, parent, patch.nodes, index)
      }

      break
    }

    case PatchType.RemoveNodes: {
      let parent = getVNodeById(vtree, patch.parentId)

      if (parent && isElementVNode(parent)) {
        const index = patch.previousSiblingId
          ? parent.children.indexOf(patch.previousSiblingId)
          : 0

        return revert
          ? insertSubTreesAtNode(vtree, parent, patch.nodes, index)
          : removeSubTreesAtNode(vtree, parent, patch.nodes)
      }

      break
    }
  }

  return vtree
}
