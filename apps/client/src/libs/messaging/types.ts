export interface Intent<T extends string, P extends any> {
  type: T
  payload?: P
}

export type Unsubscribe = () => void

export type Resolver<P = any, R = any> = (payload: P) => Promise<R>

export interface Agent {
  raiseIntent<T extends string, P, R>(
    intent: Intent<T, P>,
    options?: any
  ): Promise<R>
  subscribeToIntent<T extends string, P, R>(
    type: T,
    resolver: Resolver<P, R>
  ): Unsubscribe
}
