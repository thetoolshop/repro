import { nanoid } from 'nanoid'
import { distinct, filter, fromEvent, map } from 'rxjs'
import { SyntheticId } from '@/types/common'
import { Agent, Intent, Resolver, Unsubscribe } from './types'

const CHANNEL = 'repro-agent'

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

export function createBroadcastAgent(): Agent {
  const channel = new BroadcastChannel(CHANNEL)
  const resolvers = new Map<string, Resolver>()
  const callbacks = new Map<SyntheticId, (result: any) => void>()

  const message$ = fromEvent<MessageEvent<Message>>(channel, 'message').pipe(
    map(event => event.data)
  )

  const intentMessage$ = message$.pipe(filter(isIntentMessage))
  const responseMessage$ = message$.pipe(filter(isResponseMessage))

  intentMessage$.subscribe(message => {
    const { correlationId, intent } = message
    const resolver = resolvers.get(intent.type)

    if (resolver) {
      resolver(intent.payload).then(response => {
        channel.postMessage({
          type: 'response',
          correlationId,
          response,
        })
      })
    }
  })

  responseMessage$
    .pipe(distinct(message => message.correlationId))
    .subscribe(message => {
      const { correlationId, response } = message
      const callback = callbacks.get(correlationId)

      if (callback) {
        callback(response)
        callbacks.delete(correlationId)
      }
    })

  function raiseIntent<T extends string, P, R>(
    intent: Intent<T, P>
  ): Promise<R> {
    const correlationId = createCorrelationId()

    const message: IntentMessage = {
      type: 'intent',
      correlationId,
      intent,
    }

    return new Promise(resolve => {
      callbacks.set(correlationId, resolve)
      channel.postMessage(message)
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
