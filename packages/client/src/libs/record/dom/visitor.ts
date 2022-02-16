import { SyntheticId } from '@/types/common'
import { VNode, VTree } from '@/types/vdom'
import {
  isExternalResource,
  isExternalStyleSheet,
  isIFrameElement,
  isLocalStylesheet,
} from '@/utils/dom'
import {
  addVNode,
  createVTreeWithRoot,
  getNodeId,
  insertSubTreesAtNode,
  isElementVNode,
} from '@/utils/vdom'
import { Visitor, Subscribable, Subscriber } from '../types'
import {
  createStyleSheetVTree,
  createVDocument,
  createVDocType,
  createVElement,
  createVText,
} from './factory'

export function createDOMVisitor() {
  /**
   * TODO
   * [x] Flatten DocumentFragment nodes
   * [x] Exclude scripts
   * [x] Attempt to inline external stylesheets (as list of text nodes)
   * [ ] Flatten CSS import rules
   * [x] Insert cross-origin stylesheets as-is
   * [x] Strip inline event listeners
   * [x] Build nested VTree for same-origin iframes
   * [ ] Build nested VTree for Shadow DOM
   * [ ] Convert same-origin images to data-uris
   * [ ] Convert cross-origin images to data-uris via extension proxy
   */

  let vtree: VTree | null = null

  function createOrUpdateVTree(node: VNode, parentId: SyntheticId | null) {
    if (!vtree) {
      vtree = createVTreeWithRoot(node)
      return
    }

    if (!parentId) {
      throw new Error('VDOM: cannot add node to tree; missing parentId')
    }

    addVNode(vtree, node, parentId)
  }

  const subscribers: Array<Subscriber<VTree>> = []

  function publish(vtree: VTree) {
    for (const subscriber of subscribers) {
      subscriber(vtree)
    }
  }

  const domVisitor: Visitor<VTree> & Subscribable<VTree> = {
    documentNode(node) {
      const vNode = createVDocument(node)

      const parent = node.defaultView ? node.defaultView.frameElement : null

      createOrUpdateVTree(vNode, parent && getNodeId(parent))
    },

    documentTypeNode(node) {
      const vNode = createVDocType(node)
      createOrUpdateVTree(vNode, node.parentNode && getNodeId(node.parentNode))
    },

    documentFragmentNode(_node) {},

    elementNode(node) {
      if (isLocalStylesheet(node) || isExternalStyleSheet(node)) {
        let subtree: VTree | null = null

        try {
          subtree = createStyleSheetVTree(node)
        } catch {}

        if (subtree) {
          if (!vtree) {
            vtree = subtree
            return
          }

          if (node.parentNode) {
            const parentId = getNodeId(node.parentNode)
            const parentVNode = vtree.nodes[parentId]

            if (parentVNode && isElementVNode(parentVNode)) {
              insertSubTreesAtNode(
                vtree,
                parentVNode,
                [subtree],
                parentVNode.children.length
              )

              return
            }
          }
        }
      }

      if (isExternalResource(node) && !isExternalStyleSheet(node)) {
        return
      }

      const vNode = createVElement(node)
      createOrUpdateVTree(vNode, node.parentNode && getNodeId(node.parentNode))
    },

    textNode(node) {
      const vNode = createVText(node)
      createOrUpdateVTree(vNode, node.parentNode && getNodeId(node.parentNode))
    },

    done() {
      const value = vtree

      if (value) {
        publish(value)
      }

      vtree = null
      return value
    },

    subscribe(subscriber) {
      subscribers.push(subscriber)
    },
  }

  return domVisitor
}

export function createIFrameVisitor() {
  let iframes: Array<Document> = []
  const subscribers: Array<Subscriber<Array<Document>>> = []

  function publish(value: Array<Document>) {
    for (const subscriber of subscribers) {
      subscriber(value)
    }
  }

  const iframeVisitor: Visitor<Array<Document>> &
    Subscribable<Array<Document>> = {
    elementNode(node) {
      if (isIFrameElement(node)) {
        const doc = node.contentDocument

        if (doc) {
          iframes.push(doc)
        }
      }
    },

    // Unimplemented
    documentNode() {},
    documentTypeNode() {},
    documentFragmentNode() {},
    textNode() {},

    done() {
      const value = iframes
      publish(value)
      iframes = []
      return value
    },

    subscribe(subscriber) {
      subscribers.push(subscriber)
    },
  }

  return iframeVisitor
}
