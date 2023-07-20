import { logger } from '@repro/logger'
import { Agent, Intent, Resolver, Unsubscribe } from '@repro/messaging'
import Future, { fork, FutureInstance } from 'fluture'

interface RuntimeOptions {
  target?: number
}

interface ResponseMessage {
  type: 'response'
  response: any
}

interface ErrorMessage {
  type: 'error'
  error: any
}

type Message = ResponseMessage | ErrorMessage

function isSupportedURL(url: string | undefined) {
  return url !== undefined && !url.startsWith('chrome://')
}

export function createRuntimeAgent(): Agent {
  const resolvers = new Map<string, Resolver>()

  function onMessage(
    intent: Intent<any>,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (message: Message) => void
  ) {
    const resolver = resolvers.get(intent.type)

    function dispatchError(error: any) {
      sendResponse({
        type: 'error',
        error,
      })
    }

    function dispatchResponse(response: any) {
      sendResponse({
        type: 'response',
        response,
      })
    }

    if (resolver) {
      fork(dispatchError)(dispatchResponse)(resolver(intent.payload))
    }

    return true
  }

  chrome.runtime.onMessage.addListener(onMessage)

  function raiseIntent<R, P = any>(
    intent: Intent<P>,
    options?: RuntimeOptions
  ): FutureInstance<Error, R> {
    return Future((reject, resolve) => {
      function callback(message: Message) {
        if (chrome.runtime.lastError) {
          logger.debug('Runtime error when raising intent', {
            error: chrome.runtime.lastError,
            intent,
            options,
          })

          reject(new Error(chrome.runtime.lastError?.message))
        } else {
          if (message.type === 'response') {
            resolve(message.response)
          } else {
            reject(message.error)
          }
        }
      }

      if (options?.target !== undefined) {
        const tabId = options.target

        chrome.tabs.get(tabId, tab => {
          if (isSupportedURL(tab.url)) {
            chrome.tabs.sendMessage(tabId, intent, callback)
          }
        })
      } else {
        chrome.runtime.sendMessage(intent, callback)
      }

      return () => {
        throw new Error('Intent is not cancellable')
      }
    })
  }

  function subscribeToIntent(type: string, resolver: Resolver): Unsubscribe {
    resolvers.set(type, resolver)

    return () => {
      resolvers.delete(type)
    }
  }

  function subscribeToIntentAndForward(
    type: string,
    forwardAgent: Agent
  ): Unsubscribe {
    return subscribeToIntent(type, payload => {
      return forwardAgent.raiseIntent({ type, payload })
    })
  }

  return {
    raiseIntent,
    subscribeToIntent,
    subscribeToIntentAndForward,
  }
}
