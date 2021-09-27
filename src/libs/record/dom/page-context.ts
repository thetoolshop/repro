import { SyntheticId } from '@/types/common'
import { Patch } from '@/types/vdom'
import { createSyntheticId } from '@/utils/vdom'
import { ObserverLike } from '../types'
import { PageContextAction } from './types'

export function createPageContextObserver(channel: BroadcastChannel): ObserverLike {
  const observers: Array<ObserverLike> = []

  function observeStyleSheet(): ObserverLike {
    const insertRule = CSSStyleSheet.prototype.insertRule
    CSSStyleSheet.prototype.insertRule = function(this, rule, index) {

    }
  }

  function onMessage(message: MessageEvent<PageContextAction>) {
    const { type } = message.data

    switch (type) {
      case 'stylesheet':
        observers.push(
          observeStyleSheet()
        )
        break
    }
  }

  channel.addEventListener('message', onMessage)

  return {
    disconnect() {
      channel.removeEventListener('message', onMessage)

      for (const observer of observers) {
        observer.disconnect()
      }
    }
  }
}

export interface PageContext {
  observeStyleSheet(subscriber: (patch: Patch) => void): ObserverLike
}

type PageContextEvent<T> = MessageEvent<{
  correlationId: SyntheticId
  payload: T
}>

export function createRemotePageContext(channel: BroadcastChannel): PageContext {
  function observeStyleSheet(subscriber: (patch: Patch) => void) {
    const correlationId = createSyntheticId()

    channel.postMessage({
      correlationId,
      payload: {
        action: 'observe',
        type: 'stylesheet'
      }
    })

    function onMessage(message: PageContextEvent<Patch>) {
      const data = message.data

      if (data.correlationId === correlationId) {
        subscriber(data.payload)
      }
    }

    channel.addEventListener('message', onMessage)

    return {
      disconnect() {
        channel.removeEventListener('message', onMessage)

        channel.postMessage({
          correlationId,
          payload: {
            action: 'disconnect',
            type: 'stylesheet'
          }
        })
      }
    }
  }

  return {
    observeStyleSheet,
  }
}
