import { Interaction, InteractionType, Point } from '@repro/domain'
import { isElementNode } from '~/utils/dom'
import { ObserverLike, createEventObserver } from '~/utils/observer'
import { getNodeId } from '~/utils/vdom'
import { RecordingOptions } from '../types'
import { sampleEventsByKey } from './sample'

type Callback = (interaction: Interaction, transposition?: number) => void

function identity<T>(value: T) {
  return value
}

export function createInteractionObserver(
  options: RecordingOptions,
  callback: Callback
): ObserverLike<Document> {
  const viewportResizeObserver = createViewportResizeObserver(
    callback,
    options.eventSampling.resize
  )
  const scrollObserver = createScrollObserver(
    callback,
    options.eventSampling.scroll
  )
  const pointerMoveObserver = createPointerMoveObserver(
    callback,
    options.eventSampling.pointerMove
  )
  const pointerDownObserver = createPointerDownObserver(callback)
  const pointerUpObserver = createPointerUpObserver(callback)
  const keyDownObserver = createKeyDownObserver(callback)
  const keyUpObserver = createKeyUpObserver(callback)

  return {
    disconnect() {
      viewportResizeObserver.disconnect()
      scrollObserver.disconnect()
      pointerMoveObserver.disconnect()
      pointerDownObserver.disconnect()
      pointerUpObserver.disconnect()
      keyDownObserver.disconnect()
      keyUpObserver.disconnect()
    },

    observe(doc, vtree) {
      viewportResizeObserver.observe(doc, vtree)
      scrollObserver.observe(doc, vtree)
      pointerMoveObserver.observe(doc, vtree)
      pointerDownObserver.observe(doc, vtree)
      pointerUpObserver.observe(doc, vtree)
      keyDownObserver.observe(doc, vtree)
      keyUpObserver.observe(doc, vtree)
    },
  }
}

function createViewportResizeObserver(
  callback: Callback,
  sampling: number
): ObserverLike<Document> {
  let prevWidth = 0
  let prevHeight = 0

  const handleViewportResize = sampleEventsByKey<UIEvent, Point>(
    () => 'viewport-resize',
    ev => {
      const win = ev.target as Window
      return [win.innerWidth, win.innerHeight] as Point
    },
    (value, duration) => {
      callback(
        {
          type: InteractionType.ViewportResize,
          from: [prevWidth, prevHeight],
          to: value,
          duration,
        },
        duration
      )

      prevWidth = value[0]
      prevHeight = value[1]
    },
    sampling
  )

  const viewportResizeObserver = createEventObserver(
    'resize',
    handleViewportResize
  )

  return {
    disconnect: () => viewportResizeObserver.disconnect(),
    observe(doc, vtree) {
      const win = doc.defaultView

      // Only capture viewport size for root window
      if (win && win === win.top) {
        prevWidth = win.innerWidth
        prevHeight = win.innerHeight
        viewportResizeObserver.observe(win, vtree)
      }
    },
  }
}

function createScrollObserver(
  callback: Callback,
  sampling: number
): ObserverLike {
  const prevScrollMap = new WeakMap<EventTarget, Point>()

  const handleScroll = sampleEventsByKey<Event, Event>(
    (ev: Event) => getNodeId(ev.target as Node),
    identity,
    (ev, duration) => {
      const eventTarget = ev.target as Node

      let target: Element | null

      if ('scrollingElement' in eventTarget) {
        target = (eventTarget as Document).scrollingElement
      } else if ('documentElement' in eventTarget) {
        target = (eventTarget as Document).documentElement
      } else {
        target = eventTarget as Element
      }

      if (!target) {
        return
      }

      const prevScroll = prevScrollMap.get(target) || [0, 0]
      const nextScroll = [target.scrollLeft, target.scrollTop] as Point

      prevScrollMap.set(target, nextScroll)

      callback(
        {
          type: InteractionType.Scroll,
          target: getNodeId(target),
          from: prevScroll,
          to: [target.scrollLeft, target.scrollTop] as Point,
          duration,
        },
        duration
      )
    },
    sampling
  )

  return createEventObserver('scroll', handleScroll)
}

function createPointerMoveObserver(
  callback: Callback,
  sampling: number
): ObserverLike {
  let prevX: number | null = null
  let prevY: number | null = null

  const handlePointerMove = sampleEventsByKey(
    () => 'pointermove',
    (evt: PointerEvent) => {
      let offsetX = 0
      let offsetY = 0

      const eventTarget = evt.target

      if (eventTarget && isElementNode(eventTarget as Node)) {
        const ownerDocument = (eventTarget as Element).ownerDocument
        const defaultView = ownerDocument.defaultView
        const frameElement = defaultView ? defaultView.frameElement : null

        if (frameElement) {
          const { x, y } = frameElement.getBoundingClientRect()
          offsetX = x
          offsetY = y
        }
      }

      return [evt.clientX + offsetX, evt.clientY + offsetY] as Point
    },
    (value, duration) => {
      const [x, y] = value

      callback(
        {
          type: InteractionType.PointerMove,
          from: [prevX ?? x, prevY ?? y],
          to: value,
          duration,
        },
        duration
      )

      prevX = x
      prevY = y
    },
    sampling
  )

  return createEventObserver('pointermove', handlePointerMove)
}

function createPointerDownObserver(callback: Callback): ObserverLike<Document> {
  return createEventObserver('pointerdown', evt => {
    const target = evt.target as Node
    const doc = target.ownerDocument

    if (!doc) {
      // Should we capture events without targets?
      return
    }

    const x = evt.clientX
    const y = evt.clientY

    const targets = doc.elementsFromPoint(x, y).map(elem => getNodeId(elem))

    callback({
      type: InteractionType.PointerDown,
      targets,
      at: [x, y],
    })
  })
}

function createPointerUpObserver(callback: Callback): ObserverLike<Document> {
  return createEventObserver('pointerup', evt => {
    const target = evt.target as Node
    const doc = target.ownerDocument

    if (!doc) {
      // Should we capture events without targets?
      return
    }

    const x = evt.clientX
    const y = evt.clientY

    const targets = doc.elementsFromPoint(x, y).map(elem => getNodeId(elem))

    callback({
      type: InteractionType.PointerUp,
      targets,
      at: [x, y],
    })
  })
}

function createKeyDownObserver(callback: Callback): ObserverLike {
  return createEventObserver('keydown', evt => {
    callback({
      type: InteractionType.KeyDown,
      key: evt.key,
    })
  })
}

function createKeyUpObserver(callback: Callback): ObserverLike {
  return createEventObserver('keyup', evt => {
    callback({
      type: InteractionType.KeyUp,
      key: evt.key,
    })
  })
}
