import { FutureInstance } from 'fluture'

export interface Intent<P = any> {
  type: string
  payload?: P
}

export type Unsubscribe = () => void

export type Resolver<R = any> = (payload: any) => FutureInstance<Error, R>

export interface Agent {
  name: string
  raiseIntent<R, P = any>(
    intent: Intent<P>,
    options?: any
  ): FutureInstance<Error, R>
  subscribeToIntent(type: string, resolver: Resolver): Unsubscribe
  subscribeToIntentAndForward(type: string, forwardAgent: Agent): Unsubscribe
}
