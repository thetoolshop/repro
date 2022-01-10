import { usePlayback } from '@/libs/playback'
import { SyntheticId } from '@/types/common'
import { InteractionType, Point, ScrollMap } from '@/types/interaction'
import {
  DOMPatchEvent,
  InteractionEvent,
  SourceEventType,
} from '@/types/recording'
import { PatchType, VTree } from '@/types/vdom'
import { isElementNode, isHTMLElement, isTextNode } from '@/utils/dom'
import { interpolatePointFromSample } from '@/utils/source'
import {
  isDocTypeVNode,
  isDocumentVNode,
  isElementVNode,
  isStyleElementVNode,
  isTextVNode,
} from '@/utils/vdom'
import React, { useEffect } from 'react'
import { asapScheduler, from, Subscription } from 'rxjs'
import { distinctUntilChanged, map, observeOn, switchMap } from 'rxjs/operators'
import { OUT_OF_BOUNDS_POINT } from '../constants'

const HOVER_CLASS = '-repro-hover'
const HOVER_SELECTOR = `.${HOVER_CLASS}`

type MutableNodeMap = Record<SyntheticId, Node>

interface Props {
  ownerDocument: Document | null
  onLoad?: () => void
}

export const NativeDOMRenderer: React.FC<Props> = ({
  ownerDocument,
  onLoad,
}) => {
  const playback = usePlayback()

  useEffect(() => {
    let nodeMap: MutableNodeMap = {}

    const subscription = new Subscription()

    subscription.add(
      playback.$latestControlFrame
        .pipe(observeOn(asapScheduler))
        .subscribe(() => {
          const snapshot = playback.getSnapshot()
          const pointer = snapshot.interaction?.pointer || OUT_OF_BOUNDS_POINT
          const scrollMap = snapshot.interaction?.scroll || {}

          if (ownerDocument) {
            clearDocument(ownerDocument)

            if (snapshot.dom) {
              const documentElement = ownerDocument.documentElement
              const [rootNode, vtreeNodeMap] = createDOMFromVTree(snapshot.dom)

              patchDocumentElement(snapshot.dom, vtreeNodeMap, documentElement)

              if (rootNode) {
                documentElement.appendChild(rootNode)
                nodeMap = vtreeNodeMap

                if (ownerDocument.defaultView) {
                  console.log(
                    'NativeDOMRenderer: window',
                    ownerDocument.defaultView
                  )
                  console.log(
                    'NativeDOMRenderer: document ready-state',
                    ownerDocument.readyState
                  )
                  ownerDocument.defaultView.addEventListener('load', () =>
                    console.log('NativeDOMRenderer: load')
                  )
                }

                if (onLoad) {
                  onLoad()
                }

                updateAllScrollStates(nodeMap, scrollMap)
                updateHoverTargets(ownerDocument, pointer)
              }
            }
          }
        })
    )

    subscription.add(
      playback.$snapshot
        .pipe(
          observeOn(asapScheduler),
          map(snapshot => snapshot.interaction?.pointer || OUT_OF_BOUNDS_POINT),
          distinctUntilChanged()
        )
        .subscribe(pointer => {
          if (ownerDocument) {
            // TODO: schedule this on idle callback
            updateHoverTargets(ownerDocument, pointer)
          }
        })
    )

    subscription.add(
      playback.$buffer
        .pipe(switchMap(buffer => from(buffer)))
        .subscribe(event => {
          switch (event.type) {
            case SourceEventType.DOMPatch:
              applyDOMPatchEvent(event, nodeMap)
              break

            case SourceEventType.Interaction:
              applyInteractionEvent(event, nodeMap, playback.getElapsed())
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
  }, [ownerDocument, playback, onLoad])

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
      // Override CSS `scroll-behavior` if set
      if (isHTMLElement(node)) {
        node.style.scrollBehavior = 'auto'
      }

      node.scrollTo(x, y)

      // Revert CSS `scroll-behavior`
      if (isHTMLElement(node)) {
        node.style.scrollBehavior = ''
      }
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

    if (nodeMap.hasOwnProperty(nodeId)) {
      console.warn(
        `Duplicate node(${nodeId}) of parent(${parentId})`,
        nodeMap[nodeId],
        vNode,
        parentVNode
      )
    }

    if (!vNode) {
      throw new Error(
        `PlaybackCanvas/NativeDOMRenderer: could not find VNode: ${nodeId}`
      )
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

      for (const [name, value] of Object.entries(vNode.attributes)) {
        frame.setAttribute(name, value ?? '')
      }

      frame.addEventListener(
        'load',
        () => {
          const doc = frame.contentDocument

          if (doc) {
            doc.open()
            doc.write('<!doctype html>')
            doc.close()

            const root = document.createElement('html')
            doc.documentElement.remove()
            doc.appendChild(root)

            const fragment = document.createDocumentFragment()

            for (const childId of vNode.children) {
              fragment.appendChild(createNode(childId, nodeId, svgContext))
            }

            root.appendChild(fragment)
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

    if (isElementNode(node)) {
      node.setAttribute('data-repro-node', nodeId)
    }

    nodeMap[nodeId] = node

    return node
  }

  return [createNode(vtree.rootId, null, false), nodeMap]
}

function patchDocumentElement(
  vtree: VTree,
  nodeMap: MutableNodeMap,
  documentElement: HTMLElement
) {
  const queue = [vtree.rootId]

  let nodeId: SyntheticId | undefined
  while ((nodeId = queue.shift())) {
    const vNode = vtree.nodes[nodeId]

    if (!vNode) {
      throw new Error(
        `PlaybackCanvas/NativeDOMRenderer: could not find VNode: ${nodeId}`
      )
    }

    if (isElementVNode(vNode) && vNode.tagName === 'html') {
      nodeMap[nodeId] = documentElement

      for (const [name, value] of Object.entries(vNode.attributes)) {
        documentElement.setAttribute(name, value ?? '')
      }

      break
    }

    if ('children' in vNode) {
      queue.push(...vNode.children)
    }
  }
}