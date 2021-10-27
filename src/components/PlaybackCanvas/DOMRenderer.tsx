import React, { useEffect, useRef } from 'react'
import { SyntheticId } from '@/types/common'
import {
  PlaybackState,
  getPointer,
  getSnapshot,
  useBuffer,
  usePlaybackState,
  getScrollStates,
} from '@/libs/playback'
import { InteractionType } from '@/types/interaction'
import { SourceEventType } from '@/types/recording'
import { VNode, VTree } from '@/types/vdom'
import { isDocTypeVNode, isDocumentVNode, isTextVNode } from '@/utils/vdom'

interface Props {
  ownerDocument: Document | null
}

export const DOMRenderer: React.FC<Props> = ({ ownerDocument }) => {
  const nodeMap = useRef(new Map<SyntheticId, Node>())
  const buffer = useBuffer()
  const playbackState = usePlaybackState()

  function createDOMTreeForSnapshot(snapshot: VTree | null) {
    function createNode(nodeId: SyntheticId, parentId: SyntheticId | null) {
      const vNode = snapshot ? snapshot.nodes[nodeId] : null
      const parentVNode = parentId && snapshot ? snapshot.nodes[parentId] : null

      if (!vNode) {
        throw new Error(`DOMRenderer: could not find VNode(${nodeId})`)
      }

      let node: Node | null = null

      if (isTextVNode(vNode)) {
        node = document.createTextNode(vNode.value)
        // TODO: if parent is stylesheet node, add hover classes
      }

      else if (isDocumentVNode(vNode)) {
        node = document.createDocumentFragment()

        for (const childId of vNode.children) {
          const child = createNode(childId, nodeId)

          if (child) {
            node.appendChild(child)
          }
        }
      }

      else if (isDocTypeVNode(vNode)) {
        node = null
      }

      else {
        if (vNode.tagName === 'html') {
          node = document.createDocumentFragment()
          // TODO: set document scroll position
        }

        else if (vNode.tagName === 'iframe') {
          node = document.createElement('iframe')
          const frameDoc = (node as HTMLIFrameElement).contentDocument

          for (const [name, value] of Object.entries(vNode.attributes)) {
            (node as Element).setAttribute(name, value ?? '')
          }

          if (frameDoc) {
            for (const childId of vNode.children) {
              const child = createNode(childId, nodeId)

              if (child) {
                frameDoc.appendChild(child)
              }
            }
          }
        }

        else {
          node = document.createElement(vNode.tagName)
        }
      }

      if (node) {
        nodeMap.current.set(vNode.id, node)
      }

      return node
    }

    if (!snapshot) {
      return null
    }

    return createNode(snapshot.rootId, null)
  }

  useEffect(() => {
    if (playbackState === PlaybackState.Playing) {
      const snapshot = getSnapshot()
      const pointer = getPointer()
      const scrollStates = getScrollStates()

      // TODO: clear and re-render DOM from snapshot
      if (ownerDocument) {
        ownerDocument.documentElement.remove()
      }
    }
  }, [nodeMap, playbackState, ownerDocument])

  useEffect(() => {
    for (const event of buffer) {
      switch (event.type) {
        case SourceEventType.DOMPatch:
          // TODO: apply patch to DOM
          break

        case SourceEventType.Interaction:
          if (event.data.type === InteractionType.Scroll) {
            // TODO: apply scroll state to nodes
          }
          break
      }
    }
  }, [nodeMap, buffer])

  return null
}

