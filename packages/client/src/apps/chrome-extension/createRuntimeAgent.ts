import { Agent, Intent, Resolver, Unsubscribe } from '@/libs/messaging'

interface RuntimeOptions {
  target?: number
}

export function createRuntimeAgent(): Agent {
  const resolvers = new Map<string, Resolver>()

  function onMessage(
    intent: Intent<any, any>,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) {
    const resolver = resolvers.get(intent.type)

    if (resolver) {
      resolver(intent.payload).then(sendResponse)
    }

    return true
  }

  chrome.runtime.onMessage.addListener(onMessage)

  function raiseIntent<T extends string, P, R>(
    intent: Intent<T, P>,
    options?: RuntimeOptions
  ): Promise<R> {
    return new Promise(resolve => {
      if (options?.target !== undefined) {
        chrome.tabs.sendMessage(options.target, intent)
      } else {
        chrome.runtime.sendMessage(intent, resolve)
      }
    })
  }

  function subscribeToIntent<T extends string, P, R>(
    type: T,
    resolver: Resolver<P, R>
  ): Unsubscribe {
    resolvers.set(type, resolver)

    return () => {
      resolvers.delete(type)
    }
  }

  return {
    raiseIntent,
    subscribeToIntent,
  }
}
