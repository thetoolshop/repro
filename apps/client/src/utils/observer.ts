import { Immutable } from '@/types/extensions'
import { VTree } from '@repro/domain'

export interface ObserverLike<T extends any = any> {
  disconnect(): void
  observe(target: T, vtree: Immutable<VTree>): void
}

export function createEventObserver<
  K extends keyof GlobalEventHandlersEventMap
>(
  type: K,
  listener: (
    this: GlobalEventHandlers,
    ev: GlobalEventHandlersEventMap[K]
  ) => void
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
