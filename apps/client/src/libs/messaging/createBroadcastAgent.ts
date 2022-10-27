import Future, { fork, FutureInstance } from 'fluture'
import { nanoid } from 'nanoid'
import { distinct, filter, fromEvent, map } from 'rxjs'
import { SyntheticId } from '@repro/domain'
import { Agent, Intent, Resolver, Unsubscribe } from './types'

const CHANNEL = 'repro-agent'

function createCorrelationId(): SyntheticId {
  return nanoid(5)
}

interface IntentMessage {
  type: 'intent'
  correlationId: SyntheticId
  intent: Intent<any>
}

interface ResponseMessage {
  type: 'response'
  correlationId: SyntheticId
  response: any
}

interface ErrorMessage {
  type: 'error'
  correlationId: SyntheticId
  error: any
}

type Message = IntentMessage | ResponseMessage | ErrorMessage

function isIntentMessage(message: Message): message is IntentMessage {
  return message.type === 'intent'
}

function isResponseMessage(message: Message): message is ResponseMessage {
  return message.type === 'response'
}

function isErrorMessage(message: Message): message is ErrorMessage {
  return message.type === 'error'
}

export function createBroadcastAgent(): Agent {
  const channel = new BroadcastChannel(CHANNEL)
  const resolvers = new Map<string, Resolver>()
  const callbacks = new Map<
    SyntheticId,
    {
      resolve: (result: any) => void
      reject: (error: Error) => void
    }
  >()

  const message$ = fromEvent<MessageEvent<Message>>(channel, 'message').pipe(
    map(event => event.data)
  )

  const intentMessage$ = message$.pipe(filter(isIntentMessage))
  const responseMessage$ = message$.pipe(filter(isResponseMessage))
  const errorMessage$ = message$.pipe(filter(isErrorMessage))

  intentMessage$.subscribe(message => {
    const { correlationId, intent } = message
    const resolver = resolvers.get(intent.type)

    function dispatchError(error: any) {
      channel.postMessage({
        type: 'error',
        correlationId,
        error,
      })
    }

    function dispatchResponse(response: any) {
      channel.postMessage({
        type: 'response',
        correlationId,
        response,
      })
    }

    if (resolver) {
      fork(dispatchError)(dispatchResponse)(resolver(intent.payload))
    }
  })

  responseMessage$
    .pipe(distinct(message => message.correlationId))
    .subscribe(message => {
      const { correlationId, response } = message
      const callback = callbacks.get(correlationId)

      if (callback) {
        callback.resolve(response)
        callbacks.delete(correlationId)
      }
    })

  errorMessage$
    .pipe(distinct(message => message.correlationId))
    .subscribe(message => {
      const { correlationId, error } = message
      const callback = callbacks.get(correlationId)

      if (callback) {
        callback.reject(error)
        callbacks.delete(correlationId)
      }
    })

  function raiseIntent<R, P = any>(
    intent: Intent<P>
  ): FutureInstance<Error, R> {
    const correlationId = createCorrelationId()

    const message: IntentMessage = {
      type: 'intent',
      correlationId,
      intent,
    }

    return Future((reject, resolve) => {
      callbacks.set(correlationId, { resolve, reject })
      channel.postMessage(message)

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
