import { nanoid } from 'nanoid'
import { filter, fromEvent, map } from 'rxjs'
import { SyntheticId } from '@repro/domain'
import { Agent, Intent, Resolver, Unsubscribe } from './types'

function createCorrelationId(): SyntheticId {
  return nanoid(5)
}

interface IntentMessage {
  type: 'intent'
  correlationId: SyntheticId
  intent: Intent<any, any>
}

interface ResponseMessage {
  type: 'response'
  correlationId: SyntheticId
  response: any
}

type Message = IntentMessage | ResponseMessage

function isIntentMessage(message: Message): message is IntentMessage {
  return message.type === 'intent'
}

function isResponseMessage(message: Message): message is ResponseMessage {
  return message.type === 'response'
}

const EVENT_NAME = 'repro-ptp-message'

export function createPTPAgent(): Agent {
  const callbacks = new Map<SyntheticId, (payload: any) => void>()
  const resolvers = new Map<SyntheticId, Resolver<any, any>>()

  const message$ = fromEvent<CustomEvent<Message>>(window, EVENT_NAME).pipe(
    map(event => event.detail)
  )

  const intentMessage$ = message$.pipe(filter(isIntentMessage))
  const responseMessage$ = message$.pipe(filter(isResponseMessage))

  intentMessage$.subscribe(message => {
    const { correlationId, intent } = message
    const resolver = resolvers.get(intent.type)

    if (resolver) {
      resolver(intent.payload).then(response => {
        dispatch({
          type: 'response',
          correlationId,
          response,
        })
      })
    }
  })

  responseMessage$.subscribe(message => {
    const { correlationId, response } = message
    const callback = callbacks.get(correlationId)

    if (callback) {
      callback(response)
      callbacks.delete(correlationId)
    }
  })

  function dispatch(message: Message) {
    const event = new CustomEvent(EVENT_NAME, {
      detail: message,
    })

    window.dispatchEvent(event)
  }

  function raiseIntent<T extends string, P, R>(
    intent: Intent<T, P>
  ): Promise<R> {
    return new Promise(resolve => {
      const correlationId = createCorrelationId()

      callbacks.set(correlationId, resolve)

      dispatch({
        type: 'intent',
        correlationId,
        intent,
      })
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
