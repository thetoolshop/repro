import { logger } from '@repro/logger'
import { Agent, Intent, Resolver, Unsubscribe } from '@repro/messaging'
import Future, { FutureInstance, fork } from 'fluture'
import browser, { Events, Runtime } from 'webextension-polyfill'

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

type MessagingRuntime = Omit<Runtime.Static, 'onMessage'> & {
  onMessage: Events.Event<
    (
      intent: Intent<any>,
      sender: Runtime.MessageSender,
      sendResponse: (message: Message) => void
    ) => true | undefined
  >
}

const runtime = browser.runtime as MessagingRuntime

function isSupportedURL(url: string | undefined) {
  return url !== undefined && !url.startsWith('browser://')
}

export function createRuntimeAgent(): Agent {
  const resolvers = new Map<string, Resolver>()

  function onMessage(
    intent: Intent<any>,
    _sender: Runtime.MessageSender,
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
      return true
    }

    return undefined
  }

  runtime.onMessage.addListener(onMessage)

  function raiseIntent<R, P = any>(
    intent: Intent<P>,
    options?: RuntimeOptions
  ): FutureInstance<Error, R> {
    return Future((reject, resolve) => {
      function callback(message: Message) {
        if (runtime.lastError) {
          logger.debug('Runtime error when raising intent', {
            error: runtime.lastError,
            intent,
            options,
          })

          reject(new Error(runtime.lastError?.message))
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

        browser.tabs.get(tabId).then(tab => {
          if (isSupportedURL(tab.url)) {
            browser.tabs
              .sendMessage<Intent<P>, Message>(tabId, intent)
              .then(callback)
              .catch(reject)
          }
        })
      } else {
        runtime
          .sendMessage<Intent<P>, Message>(intent)
          .then(callback)
          .catch(reject)
      }

      return () => {
        console.warn('Intent is not cancellable')
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
    name: 'RuntimeAgent',
    raiseIntent,
    subscribeToIntent,
    subscribeToIntentAndForward,
  }
}
