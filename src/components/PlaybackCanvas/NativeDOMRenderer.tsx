import React, { useEffect } from 'react'
import { asapScheduler, from, Subscription } from 'rxjs'
import { observeOn, switchMap } from 'rxjs/operators'
import { useReplay } from '@/libs/playback'
import { SyntheticId } from '@/types/common'
import { InteractionType, Point, ScrollMap } from '@/types/interaction'
import {
  DOMPatchEvent,
  InteractionEvent,
  SourceEventType,
} from '@/types/recording'
import { PatchType, VTree } from '@/types/vdom'
import { isElementNode, isTextNode } from '@/utils/dom'
import { interpolatePointFromSample } from '@/utils/source'
import {
  isDocTypeVNode,
  isDocumentVNode,
  isStyleElementVNode,
  isTextVNode,
} from '@/utils/vdom'

const HOVER_CLASS = '-repro-hover'
const HOVER_SELECTOR = `.${HOVER_CLASS}`

type MutableNodeMap = Record<SyntheticId, Node>

interface Props {
  ownerDocument: Document | null
}

export const NativeDOMRenderer: React.FC<Props> = ({ ownerDocument }) => {
  const replay = useReplay()

  useEffect(() => {
    let nodeMap: MutableNodeMap = {}

    const subscription = new Subscription()

    subscription.add(
      replay.$snapshot.pipe(observeOn(asapScheduler)).subscribe(snapshot => {
        if (ownerDocument) {
          clearDocument(ownerDocument)

          if (snapshot.dom) {
            const [rootNode, vtreeNodeMap] = createDOMFromVTree(snapshot.dom)

            if (rootNode) {
              ownerDocument.documentElement.appendChild(rootNode)
              nodeMap = vtreeNodeMap

              updateAllScrollStates(nodeMap, replay.getScrollMap())
              updateHoverTargets(ownerDocument, replay.getPointer())
            }
          }
        }
      })
    )

    subscription.add(
      replay.$pointer.subscribe(pointer => {
        if (ownerDocument) {
          updateHoverTargets(ownerDocument, pointer)
        }
      })
    )

    subscription.add(
      replay.$buffer
        .pipe(switchMap(buffer => from(buffer)))
        .subscribe(event => {
          switch (event.type) {
            case SourceEventType.DOMPatch:
              applyDOMPatchEvent(event, nodeMap)
              break

            case SourceEventType.Interaction:
              applyInteractionEvent(event, nodeMap, replay.getElapsed())
              break
          }
        })
    )

    return () => {
      subscription.unsubscribe()

      if (ownerDocument) {
        clearDocument(ownerDocument)
      }
    }
  }, [ownerDocument, replay])

  return null
}

function clearDocument(doc: Document) {
  while (doc.documentElement.firstChild) {
    doc.documentElement.firstChild.remove()
  }
}

function updateHoverTargets(doc: Document, pointer: Point) {
  const existingHoverTargets = doc.querySelectorAll(HOVER_SELECTOR)
  const hoverTargets = doc.elementsFromPoint(...pointer)

  for (const element of Array.from(existingHoverTargets)) {
    element.classList.remove(HOVER_CLASS)
  }

  for (const element of hoverTargets) {
    element.classList.add(HOVER_CLASS)
  }
}

function updateAllScrollStates(nodeMap: MutableNodeMap, scrollMap: ScrollMap) {
  for (const [nodeId, [x, y]] of Object.entries(scrollMap)) {
    const node = nodeMap[nodeId]

    if (node && isElementNode(node)) {
      node.scrollTo(x, y)
    }
  }
}

function applyDOMPatchEvent(event: DOMPatchEvent, nodeMap: MutableNodeMap) {
  switch (event.data.type) {
    case PatchType.Text: {
      const targetId = event.data.targetId
      const node = nodeMap[targetId]

      if (node && isTextNode(node)) {
        node.textContent = event.data.value
      }

      break
    }

    case PatchType.Attribute: {
      const targetId = event.data.targetId
      const node = nodeMap[targetId]

      if (node && isElementNode(node)) {
        node.setAttribute(event.data.name, event.data.value ?? '')
      }

      break
    }

    case PatchType.AddNodes: {
      const parentId = event.data.parentId
      const nextSiblingId = event.data.nextSiblingId

      const parent = nodeMap[parentId]

      if (parent) {
        const [fragment, newNodeMap] = event.data.nodes
          .map(vtree => createDOMFromVTree(vtree))
          .reduce(
            ([fragment, nodeMap], [node, nextNodeMap]) => {
              if (fragment && node) {
                fragment.appendChild(node)
                Object.assign(nodeMap, nextNodeMap)
              }

              return [fragment, nodeMap]
            },
            [document.createDocumentFragment(), {}]
          )

        if (!fragment) {
          break
        }

        const next =
          nextSiblingId !== null ? nodeMap[nextSiblingId] ?? null : null

        if (next) {
          parent.insertBefore(fragment, next)
        } else {
          parent.appendChild(fragment)
        }

        Object.assign(nodeMap, newNodeMap)
      }

      break
    }

    case PatchType.RemoveNodes: {
      const rootNodeIds = event.data.nodes.map(vtree => vtree.rootId)

      const nodeIds = event.data.nodes.flatMap(vtree =>
        Object.keys(vtree.nodes)
      )

      for (const nodeId of rootNodeIds) {
        const node = nodeMap[nodeId]
        const parent = node?.parentNode || null

        if (node && parent) {
          parent.removeChild(node)
        }
      }

      for (const nodeId of nodeIds) {
        delete nodeMap[nodeId]
      }

      break
    }
  }
}

function applyInteractionEvent(
  event: InteractionEvent,
  nodeMap: MutableNodeMap,
  elapsed: number
) {
  if (event.data.type === InteractionType.Scroll) {
    const target = event.data.target
    const node = nodeMap[target]

    if (node && isElementNode(node)) {
      const [left, top] = interpolatePointFromSample(
        event.data,
        event.time,
        elapsed
      )

      node.scrollTo({
        left,
        top,
        behavior: 'smooth',
      })
    }
  }
}

function createDOMFromVTree(vtree: VTree): [Node | null, MutableNodeMap] {
  const nodeMap: MutableNodeMap = {}

  const createNode = (
    nodeId: SyntheticId,
    parentId: SyntheticId | null,
    svgContext: boolean = false
  ): Node => {
    const vNode = vtree.nodes[nodeId] || null
    const parentVNode = (parentId && vtree.nodes[parentId]) || null

    if (!vNode) {
      throw new Error(`NativeDOMRenderer: could not find VNode: ${nodeId}`)
    }

    let node: Node

    if (isTextVNode(vNode)) {
      let value = vNode.value

      // CSS hover states cannot be triggered programmatically.
      // Replace hover pseudo-selectors with class selector.
      if (parentVNode && isStyleElementVNode(parentVNode)) {
        value = value.replace(':hover', HOVER_SELECTOR)
      }

      node = document.createTextNode(value)
    } else if (isDocTypeVNode(vNode)) {
      node = document.createDocumentFragment()
    } else if (isDocumentVNode(vNode) || vNode.tagName === 'html') {
      const fragment = document.createDocumentFragment()

      for (const childId of vNode.children) {
        fragment.appendChild(createNode(childId, nodeId, svgContext))
      }

      node = fragment
    } else if (vNode.tagName === 'iframe') {
      const frame = document.createElement('iframe')

      frame.addEventListener(
        'load',
        () => {
          if (frame.contentDocument) {
            const fragment = document.createDocumentFragment()

            for (const childId of vNode.children) {
              fragment.appendChild(createNode(childId, nodeId, svgContext))
            }

            frame.contentDocument.appendChild(fragment)
          }
        },
        { once: true }
      )

      node = frame
    } else {
      if (vNode.tagName === 'svg') {
        svgContext = true
      }

      const element = svgContext
        ? document.createElementNS('http://www.w3.org/2000/svg', vNode.tagName)
        : document.createElement(vNode.tagName)

      if (vNode.tagName === 'foreignObject') {
        svgContext = false
      }

      for (const [name, value] of Object.entries(vNode.attributes)) {
        element.setAttribute(name, value ?? '')
      }

      for (const childId of vNode.children) {
        element.appendChild(createNode(childId, nodeId, svgContext))
      }

      node = element
    }

    nodeMap[nodeId] = node

    return node
  }

  return [createNode(vtree.rootId, null, false), nodeMap]
}
