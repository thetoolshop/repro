import { Agent, Intent, Resolver, Unsubscribe } from './types'

export function createLoopbackAgent(): Agent {
  const resolvers = new Map<string, Resolver>()

  function raiseIntent<T extends string, P, R>(
    intent: Intent<T, P>
  ): Promise<R> {
    const resolver = resolvers.get(intent.type)

    if (resolver) {
      return resolver(intent.payload)
    }

    return Promise.reject(
      `LoopbackAgent: cannot find resolver for type "${intent.type}"`
    )
  }

  function subscribeToIntent<T extends string, P, R>(
    type: T,
    resolver: Resolver<P, R>
  ): Unsubscribe {
    if (resolvers.has(type)) {
      throw new Error(
        `LoopbackAgent: resolver already registered for type "${type}"`
      )
    }

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
