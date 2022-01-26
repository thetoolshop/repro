import { SyntheticId } from '@/types/common'
import { Point } from '@/types/interaction'
import { getNodeId } from '@/utils/vdom'
import { Visitor, Subscribable, Subscriber } from '../types'

type ScrollMap = Record<SyntheticId, Point>

export function createScrollVisitor() {
  let scrollMap: ScrollMap = {}
  const subscribers: Array<Subscriber<ScrollMap>> = []

  const scrollVisitor: Visitor<ScrollMap> & Subscribable<ScrollMap> = {
    elementNode(node) {
      scrollMap[getNodeId(node)] = [node.scrollLeft, node.scrollTop]
    },

    // Not implemented
    documentNode() {},
    documentFragmentNode() {},
    documentTypeNode() {},
    textNode() {},

    done() {
      const value = scrollMap

      for (const subscriber of subscribers) {
        subscriber(value)
      }

      scrollMap = {}
      return value
    },

    subscribe(subscriber) {
      subscribers.push(subscriber)
    },
  }

  return scrollVisitor
}

export function createViewportVisitor() {
  let viewport: Point = [0, 0]
  const subscribers: Array<Subscriber<Point>> = []

  const viewportVisitor: Visitor<Point> & Subscribable<Point> = {
    documentNode(node) {
      const win = node.defaultView

      if (win && win.top === win.self) {
        viewport = [win.innerWidth, win.innerHeight]
      }
    },

    // Not implemented
    documentFragmentNode() {},
    documentTypeNode() {},
    elementNode() {},
    textNode() {},

    done() {
      const value = viewport

      for (const subscriber of subscribers) {
        subscriber(value)
      }

      viewport = [0, 0]
      return value
    },

    subscribe(subscriber) {
      subscribers.push(subscriber)
    },
  }

  return viewportVisitor
}
