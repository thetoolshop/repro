import {
  Patch,
  PatchType,
  SyntheticId,
  VElement,
  VNode,
  VTree,
} from '@repro/domain'
import { logger } from '@repro/logger'
import { copyObjectDeep } from '@repro/std'
import { getVNodeById } from './id-factory'
import { isElementVNode, isTextVNode } from './matchers'

export function createVTreeWithRoot(root: VNode): VTree {
  return {
    rootId: root.id,
    nodes: {
      [root.id]: root,
    },
  }
}

export function addVNode(vtree: VTree, newNode: VNode, parentId: SyntheticId) {
  const parent = vtree.nodes[parentId]

  if (!parent || !('children' in parent)) {
    throw new Error('VDOM: invalid parent')
  }

  vtree.nodes[newNode.id] = newNode
  parent.children.push(newNode.id)
}

export function replaceVNodeById(
  vtree: VTree,
  nodeId: SyntheticId,
  newNode: VNode
) {
  vtree.nodes[nodeId] = newNode
}

export function insertSubTreesAtNode(
  vtree: VTree,
  parent: VElement,
  subtrees: Array<VTree>,
  index: number
) {
  const childIds: Array<SyntheticId> = []

  for (const subtree of subtrees) {
    const childId = subtree.rootId

    if (parent.children.indexOf(childId) === -1) {
      childIds.push(childId)
    } else {
      logger.debug(
        `vdom: Overwriting subtree under node(${childId}) of parent(${parent.id})`,
        subtree,
        parent
      )
    }

    Object.assign(vtree.nodes, copyObjectDeep(subtree.nodes))
  }

  parent.children.splice(index, 0, ...childIds)
}

export function removeSubTreesAtNode(
  vtree: VTree,
  parent: VElement,
  subtrees: Array<VTree>
) {
  const childIds: Array<SyntheticId> = []

  for (const subtree of subtrees) {
    if (parent.children.indexOf(subtree.rootId) === -1) {
      continue
    }

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
export function applyVTreePatch(
  vtree: VTree,
  patch: Patch,
  revert: boolean = false
): void {
  // const start = performance.now()

  switch (patch.type) {
    case PatchType.Attribute: {
      let node = getVNodeById(vtree, patch.targetId)

      if (node && isElementVNode(node)) {
        node.attributes[patch.name] = revert ? patch.oldValue : patch.value
        // TODO: move these to Debugger; stats will be published for monitoring
        // Stats.sample('VDOM: apply attribute patch', performance.now() - start)
      }

      break
    }

    case PatchType.BooleanProperty:
    case PatchType.NumberProperty:
    case PatchType.TextProperty: {
      let node = getVNodeById(vtree, patch.targetId)

      if (node && isElementVNode(node)) {
        const propertyName = patch.name as keyof VElement['properties']
        // TODO: fix typings and type inference for element properties
        // @ts-ignore
        node.properties[propertyName] = revert ? patch.oldValue : patch.value
      }

      break
    }

    case PatchType.Text: {
      let node = getVNodeById(vtree, patch.targetId)

      if (node && isTextVNode(node)) {
        node.value = revert ? patch.oldValue : patch.value
        // TODO: move these to Debugger; stats will be published for monitoring
        // Stats.sample('VDOM: apply text patch', performance.now() - start)
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

        // TODO: move these to Debugger; stats will be published for monitoring
        // Stats.sample('VDOM: apply add-nodes patch', performance.now() - start)
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

        // TODO: move these to Debugger; stats will be published for monitoring
        // Stats.sample('VDOM: apply remove-nodes patch', performance.now() - start)
      }

      break
    }
  }
}
