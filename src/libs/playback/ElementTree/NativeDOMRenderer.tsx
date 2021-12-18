import React, { useEffect, useRef } from 'react'
import { usePlayback } from '@/libs/playback'
import { asapScheduler, observeOn, Subscription } from 'rxjs'
import { SyntheticId } from '@/types/common'
import { VTree } from '@/types/vdom'
import { isDocTypeVNode, isDocumentVNode, isTextVNode } from '@/utils/vdom'

type MutableNodeMap = Record<SyntheticId, Node>

interface Props {
  renderTarget: HTMLElement | null
}

export const NativeDOMRenderer: React.FC<Props> = ({ renderTarget }) => {
  const playback = usePlayback()
  const openNodes = useRef(new Set<SyntheticId>())

  useEffect(() => {
    let nodeMap: MutableNodeMap = {}

    const subscription = new Subscription()

    subscription.add(
      playback.$snapshot.pipe(observeOn(asapScheduler)).subscribe(snapshot => {
        if (renderTarget) {
          clearRenderTarget(renderTarget)
        }

        if (snapshot.dom) {
          const [rootNode, vtreeNodeMap] = createDOMFromVTree(
            snapshot.dom,
            openNodes
          )

          if (rootNode) {
          }
        }
      })
    )

    return () => {
      subscription.unsubscribe()

      if (renderTarget) {
        clearRenderTarget(renderTarget)
      }
    }
  }, [playback, openNodes])

  return null
}

function clearRenderTarget(renderTarget: HTMLElement) {
  while (renderTarget.firstChild) {
    renderTarget.firstChild.remove()
  }
}

function createDOMFromVTree(vtree: VTree, openNodes: Set<SyntheticId>) {
  const nodeMap: MutableNodeMap = {}

  function createNode(nodeId: SyntheticId) {
    const vNode = vtree.nodes[nodeId]

    if (!vNode) {
      throw new Error(
        `ElementTree/NativeDOMRenderer: could not find VNode: ${nodeId}`
      )
    }

    let node: Node

    if (isTextVNode(vNode)) {
      node = document.createTextNode(vNode.value)
    } else if (isDocTypeVNode(vNode)) {
      node = document.createElement('div')
      node.textContent = `<!doctype ${vNode.name}${
        vNode.publicId ? ` PUBLIC ${vNode.publicId}` : ''
      }${vNode.systemId}`
    } else if (isDocumentVNode(vNode)) {
      node = document.createDocumentFragment()

      if (openNodes.has(nodeId)) {
        for (const childId of vNode.children) {
          node.appendChild(createNode(childId))
        }
      }
    } else {
      node = document.createElement('div')

      if (openNodes.has(nodeId)) {
        for (const childId of vNode.children) {
          node.appendChild(createNode(childId))
        }
      }
    }

    nodeMap[nodeId] = node

    return node
  }

  return [createNode(vtree.rootId), nodeMap]
}
