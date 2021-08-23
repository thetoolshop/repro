import { Interaction, InteractionType, Point } from '@/types/interaction'
import { getNodeId } from '@/utils/vdom'
import { ObserverLike, RecordingOptions } from '../types'
import { sampleEventsByKey } from './sample'

type Callback = (interaction: Interaction) => void

const EMPTY_OBSERVER = {
  disconnect() {}
}

function observeEvent<K extends keyof GlobalEventHandlersEventMap>(
  target: GlobalEventHandlers,
  type: K,
  listener: (this: GlobalEventHandlers, ev: GlobalEventHandlersEventMap[K]) => void
): ObserverLike {
  target.addEventListener(type, listener, {
    capture: true,
    passive: true,
  })

  return {
    disconnect() {
      target.removeEventListener(type, listener, true)
    }
  }
}

function identity<T>(value: T) {
  return value
}

export function observeInteractions(doc: Document, options: RecordingOptions, callback: Callback): ObserverLike {
  const viewportResizeObserver = createViewportResizeObserver(doc, callback, options.eventSampling.resize)
  const scrollObserver = createScrollObserver(doc, callback, options.eventSampling.scroll)
  const pointerMoveObserver = createPointerMoveObserver(doc, callback, options.eventSampling.pointerMove)
  const pointerDownObserver = createPointerDownObserver(doc, callback)
  const pointerUpObserver = createPointerUpObserver(doc, callback)
  const keyDownObserver = createKeyDownObserver(doc, callback)
  const keyUpObserver = createKeyUpObserver(doc, callback)

  return {
    disconnect() {
      viewportResizeObserver.disconnect()
      scrollObserver.disconnect()
      pointerMoveObserver.disconnect()
      pointerDownObserver.disconnect()
      pointerUpObserver.disconnect()
      keyDownObserver.disconnect()
      keyUpObserver.disconnect()
    }
  }
}

function createViewportResizeObserver(doc: Document, callback: Callback, sampling: number): ObserverLike {
  const win = doc.defaultView

  if (!win) {
    return EMPTY_OBSERVER
  }

  let prevWidth = win.innerWidth
  let prevHeight = win.innerHeight

  const dispatchInitialViewport = () => {
    callback({
      type: InteractionType.ViewportResize,
      from: [prevWidth, prevHeight],
      to: {
        value: [prevWidth, prevHeight],
        duration: 0,
      },
    })
  }

  const handleViewportResize = sampleEventsByKey(
    () => 'viewport-resize',
    () => [win.innerWidth, win.innerHeight] as Point,
    sample => {
      callback({
        type: InteractionType.ViewportResize,
        from: [prevWidth, prevHeight],
        to: sample,
      })
    },
    sampling
  )

  dispatchInitialViewport()

  return observeEvent(win, 'resize', handleViewportResize)
}

function createScrollObserver(doc: Document, callback: Callback, sampling: number): ObserverLike {
  const prevScrollMap = new WeakMap<EventTarget, Point>()

  // TODO: fork sampling by scroll target
  const handleScroll = sampleEventsByKey<Event, Event>(
    (ev: Event) => getNodeId(ev.target as Node),
    identity,
    ({ value: evt, duration }) => {
      const target = evt.target === doc
        ? (doc.scrollingElement || doc.documentElement)
        : (evt.target as HTMLElement)

      if (!target) {
        return
      }

      let prevScroll = prevScrollMap.get(target)

      if (!prevScroll) {
        prevScroll = [0, 0]
        prevScrollMap.set(target, prevScroll)
      }

      callback({
        type: InteractionType.Scroll,
        target: getNodeId(target),
        from: prevScroll,
        to: {
          value: [target.scrollLeft, target.scrollTop] as Point,
          duration,
        }
      })
    },
    sampling
  )

  return observeEvent(doc, 'scroll', handleScroll)
}

function createPointerMoveObserver(doc: Document, callback: Callback, sampling: number): ObserverLike {
  let prevX: number | null = null
  let prevY: number | null = null

  const handlePointerMove = sampleEventsByKey(
    () => 'pointermove',
    (evt: PointerEvent) => [evt.pageX, evt.pageY] as Point,
    sample => {
      const [x, y] = sample.value

      callback({
        type: InteractionType.PointerMove,
        from: [prevX ?? x, prevY ?? y],
        to: sample,
      })

      prevX = x
      prevY = y
    },
    sampling
  )

  return observeEvent(doc, 'pointermove', handlePointerMove)
}

function createPointerDownObserver(doc: Document, callback: Callback): ObserverLike {
  return observeEvent(doc, 'pointerdown', evt => {
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

function createPointerUpObserver(doc: Document, callback: Callback): ObserverLike {
  return observeEvent(doc, 'pointerup', evt => {
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

function createKeyDownObserver(doc: Document, callback: Callback): ObserverLike {
  return observeEvent(doc, 'keydown', evt => {
    callback({
      type: InteractionType.KeyDown,
      key: evt.key,
    })
  })
}

function createKeyUpObserver(doc: Document, callback: Callback): ObserverLike {
  return observeEvent(doc, 'keyup', evt => {
    callback({
      type: InteractionType.KeyUp,
      key: evt.key,
    })
  })
}
