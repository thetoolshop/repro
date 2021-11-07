import { Interaction, InteractionType, Point } from '@/types/interaction'
import { getNodeId } from '@/utils/vdom'
import { ObserverLike, RecordingOptions } from '../types'
import { sampleEventsByKey } from './sample'

type Callback = (interaction: Interaction, transposition?: number, at?: number) => void

function createEventObserver<K extends keyof GlobalEventHandlersEventMap>(
  type: K,
  listener: (this: GlobalEventHandlers, ev: GlobalEventHandlersEventMap[K]) => void
): ObserverLike<GlobalEventHandlers> {
  const listenerMap = new Map<GlobalEventHandlers, Array<typeof listener>>()

  return {
    disconnect() {
      for (const [target, listeners] of listenerMap) {
        for (const listener of listeners) {
          target.removeEventListener(type, listener, true)
          listenerMap.delete(target)
        }
      }
    },

    observe(target) {
      target.addEventListener(type, listener, {
        capture: true,
        passive: true,
      })

      if (!listenerMap.has(target)) {
        listenerMap.set(target, [])
      }

      listenerMap.get(target)?.push(listener)
    },
  }
}

function identity<T>(value: T) {
  return value
}

export function createInteractionObserver(options: RecordingOptions, callback: Callback): ObserverLike<Document> {
  const viewportResizeObserver = createViewportResizeObserver(callback, options.eventSampling.resize)
  const scrollObserver = createScrollObserver(callback, options.eventSampling.scroll)
  const pointerMoveObserver = createPointerMoveObserver(callback, options.eventSampling.pointerMove)
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
    }
  }
}

function createViewportResizeObserver(callback: Callback, sampling: number): ObserverLike<Document> {
  let prevWidth = 0
  let prevHeight = 0

  const handleViewportResize = sampleEventsByKey<UIEvent, Point>(
    () => 'viewport-resize',
    ev => {
      const win = ev.target as Window
      return [win.innerWidth, win.innerHeight] as Point
    },
    (value, duration) => {
      callback({
        type: InteractionType.ViewportResize,
        from: [prevWidth, prevHeight],
        to: value,
        duration,
      }, duration)

      prevWidth = value[0]
      prevHeight = value[1]
    },
    sampling
  )

  const viewportResizeObserver = createEventObserver('resize', handleViewportResize)

  return {
    disconnect: () => viewportResizeObserver.disconnect(),
    observe(doc, vtree) {
      const win = doc.defaultView

      if (win) {
        prevWidth = win.innerWidth
        prevHeight = win.innerHeight

        callback({
          type: InteractionType.ViewportResize,
          from: [prevWidth, prevHeight],
          to: [prevWidth, prevHeight],
          duration: 0,
        }, 0, 0 /* initial frame (ideally observer shouldn't care about elapsed time) */)

        viewportResizeObserver.observe(win, vtree)
      }
    },
  }
}

function createScrollObserver(callback: Callback, sampling: number): ObserverLike {
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

      callback({
        type: InteractionType.Scroll,
        target: getNodeId(target),
        from: prevScroll,
        to: [target.scrollLeft, target.scrollTop] as Point,
        duration,
      }, duration)
    },
    sampling
  )

  return createEventObserver('scroll', handleScroll)
}

function createPointerMoveObserver(callback: Callback, sampling: number): ObserverLike {
  let prevX: number | null = null
  let prevY: number | null = null

  function dispatchInitialPointer() {
    callback({
      type: InteractionType.PointerMove,
      from: [0, 0],
      to: [0, 0],
      duration: 0,
    }, 0, 0)
  }

  const handlePointerMove = sampleEventsByKey(
    () => 'pointermove',
    (evt: PointerEvent) => [evt.pageX, evt.pageY] as Point,
    (value, duration) => {
      const [x, y] = value

      callback({
        type: InteractionType.PointerMove,
        from: [prevX ?? x, prevY ?? y],
        to: value,
        duration,
      }, duration)

      prevX = x
      prevY = y
    },
    sampling
  )

  dispatchInitialPointer()

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

    const x = evt.pageX
    const y = evt.pageY

    const targets = doc.elementsFromPoint(x, y)
      .map(elem => getNodeId(elem))

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

    const x = evt.pageX
    const y = evt.pageY

    const targets = doc.elementsFromPoint(x, y)
      .map(elem => getNodeId(elem))

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
