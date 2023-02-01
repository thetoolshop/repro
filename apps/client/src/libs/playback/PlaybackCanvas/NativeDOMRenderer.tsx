import { Stats } from '~/libs/diagnostics'
import { logger } from '~/libs/logger'
import { usePlayback } from '~/libs/playback'
import {
  DOMPatchEvent,
  InteractionEvent,
  InteractionType,
  PatchType,
  Point,
  ScrollMap,
  SourceEventType,
  SyntheticId,
  VTree,
} from '@repro/domain'
import {
  isBodyElement,
  isCustomElement,
  isElementNode,
  isHTMLElement,
  isTextNode,
  isValidAttributeName,
} from '~/utils/dom'
import { scheduleMicrotask } from '~/utils/schedule'
import { interpolatePointFromSample } from '~/utils/source'
import {
  isDocTypeVNode,
  isDocumentVNode,
  isElementVNode,
  isStyleElementVNode,
  isTextVNode,
} from '~/utils/vdom'
import React, { useEffect } from 'react'
import { asapScheduler, from, Subscription } from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  observeOn,
  switchMap,
} from 'rxjs/operators'
import { OUT_OF_BOUNDS_POINT } from '../constants'
import { ControlFrame } from '../types'
import { MutableNodeMap } from './types'

const HOVER_CLASS = '-repro-hover'
const HOVER_SELECTOR = `.${HOVER_CLASS}`

function isNotIdle(controlFrame: ControlFrame) {
  return controlFrame !== ControlFrame.Idle
}

interface Props {
  ownerDocument: Document | null
  trackScroll: boolean
  onLoad?: (nodeMap: MutableNodeMap) => void
}

export const NativeDOMRenderer: React.FC<Props> = ({
  ownerDocument,
  trackScroll,
  onLoad,
}) => {
  const playback = usePlayback()

  useEffect(() => {
    let nodeMap: MutableNodeMap = {}

    const subscription = new Subscription()

    subscription.add(
      playback.$latestControlFrame
        .pipe(filter(isNotIdle), observeOn(asapScheduler))
        .subscribe(() => {
          Stats.time('NativeDOMRenderer (effect): render from snapshot', () => {
            const snapshot = playback.getSnapshot()
            const pointer = snapshot.interaction?.pointer || OUT_OF_BOUNDS_POINT
            const scrollMap = snapshot.interaction?.scroll || {}

            nodeMap = {}

            if (ownerDocument) {
              if (snapshot.dom) {
                const vtree = snapshot.dom

                const [rootNode, vtreeNodeMap] = Stats.time(
                  'NativeDOMRenderer (effect): create DOM from VTree',
                  () => {
                    return createDOMFromVTree(vtree, nodeMap)
                  }
                )

                Stats.time('NativeDOMRenderer (effect): clear document', () => {
                  clearDocument(ownerDocument)
                })

                const documentElement = ownerDocument.documentElement

                Stats.time(
                  'NativeDOMRenderer (effect): patch document element',
                  () => {
                    patchDocumentElement(vtree, vtreeNodeMap, documentElement)
                  }
                )

                if (rootNode) {
                  documentElement.appendChild(rootNode)
                  nodeMap = vtreeNodeMap

                  if (onLoad) {
                    onLoad(nodeMap)
                  }

                  if (trackScroll) {
                    Stats.time(
                      'NativeDOMRenderer (effect): update all scroll states',
                      () => {
                        updateAllScrollStates(nodeMap, scrollMap)
                      }
                    )
                  }

                  Stats.time(
                    'NativeDOMRenderer (effect): update hover targets',
                    () => {
                      updateHoverTargets(ownerDocument, pointer)
                    }
                  )
                }
              }
            }
          })
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
              applyInteractionEvent(
                event,
                nodeMap,
                playback.getElapsed(),
                trackScroll
              )
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

  updateScroll(doc.documentElement, 0, 0)
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

    if (node) {
      updateScroll(node, x, y)
    }
  }
}

function updateScroll(node: Node, x: number, y: number) {
  if (node && isElementNode(node)) {
    let element = node

    if (isBodyElement(element)) {
      element = element.ownerDocument.documentElement
    }

    // Override CSS `scroll-behavior` if set
    if (isHTMLElement(element)) {
      element.style.scrollBehavior = 'auto'
    }

    element.scrollTo(x, y)

    // Revert CSS `scroll-behavior`
    if (isHTMLElement(element)) {
      element.style.scrollBehavior = ''
    }
  }
}

function applyDOMPatchEvent(event: DOMPatchEvent, nodeMap: MutableNodeMap) {
  outer: {
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
          if (isValidAttributeName(event.data.name)) {
            node.setAttribute(event.data.name, event.data.value ?? '')
          }
        }

        break
      }

      case PatchType.BooleanProperty:
      case PatchType.NumberProperty:
      case PatchType.TextProperty: {
        const targetId = event.data.targetId
        const node = nodeMap[targetId]

        if (node && isElementNode(node)) {
          // TODO: ensure property is valid for target element

          if (
            Object.getPrototypeOf(node).hasOwnProperty(
              `__original__${event.data.name}`
            )
          ) {
            // @ts-ignore
            node[`__original__${event.data.name}`] = event.data.value
            // @ts-ignore
          } else {
            // @ts-ignore
            node[event.data.name] = event.data.value
          }
        }

        break
      }

      case PatchType.AddNodes: {
        const parentId = event.data.parentId
        const previousSiblingId = event.data.previousSiblingId
        const nextSiblingId = event.data.nextSiblingId

        const parent = nodeMap[parentId]

        for (const vtree of event.data.nodes) {
          if (nodeMap.hasOwnProperty(vtree.rootId)) {
            break outer
          }
        }

        if (parent) {
          const [fragment, newNodeMap] = event.data.nodes
            .map(vtree => createDOMFromVTree(vtree, nodeMap))
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

          const prev =
            previousSiblingId !== null
              ? nodeMap[previousSiblingId] ?? null
              : null

          const next =
            nextSiblingId !== null ? nodeMap[nextSiblingId] ?? null : null

          let didMount = false

          if (prev && prev.parentNode) {
            if (prev.parentNode === parent) {
              if (prev.nextSibling) {
                parent.insertBefore(fragment, prev.nextSibling)
                didMount = true
              } else {
                parent.appendChild(fragment)
                didMount = true
              }
            }
          } else if (next && next.parentNode) {
            if (next.parentNode === parent) {
              parent.insertBefore(fragment, next)
              didMount = true
            }
          } else {
            parent.appendChild(fragment)
            didMount = true
          }

          if (didMount) {
            Object.assign(nodeMap, newNodeMap)
          }
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
}

function applyInteractionEvent(
  event: InteractionEvent,
  nodeMap: MutableNodeMap,
  elapsed: number,
  trackScroll: boolean
) {
  if (trackScroll && event.data.type === InteractionType.Scroll) {
    const target = event.data.target
    const node = nodeMap[target]

    if (node && isElementNode(node)) {
      const [left, top] = interpolatePointFromSample(
        event.data,
        event.time,
        elapsed
      )

      let element = node

      if (isBodyElement(element)) {
        element = node.ownerDocument.documentElement
      }

      element.scrollTo({
        left,
        top,
        behavior: 'smooth',
      })
    }
  }
}

function createDOMFromVTree(
  vtree: VTree,
  rootNodeMap: MutableNodeMap
): [Node | null, MutableNodeMap] {
  const nodeMap: MutableNodeMap = {}

  const createNode = (
    nodeId: SyntheticId,
    parentId: SyntheticId | null,
    svgContext: boolean = false
  ): Node => {
    const vNode = vtree.nodes[nodeId] || null
    const parentVNode = (parentId && vtree.nodes[parentId]) || null

    if (rootNodeMap.hasOwnProperty(nodeId)) {
      logger.warn(
        `render: Duplicate node(${nodeId}) of parent(${parentId})`,
        rootNodeMap[nodeId],
        vNode,
        parentVNode,
        vtree
      )

      // TODO: investigate why web component slots have duplicate renders
      return document.createDocumentFragment()
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
        if (isValidAttributeName(name)) {
          frame.setAttribute(name, value ?? '')
        }
      }

      const fragment = document.createDocumentFragment()

      for (const childId of vNode.children) {
        fragment.appendChild(createNode(childId, nodeId, svgContext))
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

      let tagName = isCustomElement(vNode.tagName) ? 'div' : vNode.tagName

      const element = svgContext
        ? document.createElementNS('http://www.w3.org/2000/svg', tagName)
        : document.createElement(tagName)

      if (vNode.tagName === 'foreignObject') {
        svgContext = false
      }

      for (const [name, value] of Object.entries(vNode.attributes)) {
        if (isValidAttributeName(name)) {
          element.setAttribute(name, value ?? '')
        }
      }

      scheduleMicrotask(() => {
        for (const [name, value] of Object.entries(vNode.properties)) {
          // TODO: ensure property is valid for target element

          if (
            Object.getPrototypeOf(element).hasOwnProperty(`__original__${name}`)
          ) {
            // @ts-ignore
            element[`__original__${name}`] = value
          } else {
            // @ts-ignore
            element[name] = value
          }
        }
      })

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
        if (isValidAttributeName(name)) {
          documentElement.setAttribute(name, value ?? '')
        }
      }

      break
    }

    if ('children' in vNode) {
      queue.push(...vNode.children)
    }
  }
}
