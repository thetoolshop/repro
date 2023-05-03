import { randomString } from '@repro/random-string'
import { fork } from 'fluture'
import { Agent, DEFAULT_AGENT } from '@repro/messaging'
import { TrackedEvent } from './types'

type Properties = Record<string, string>

let activeAgent: Agent = DEFAULT_AGENT
let activeIdentityId: string | null = null

type Consumer = (agent: Agent, identityId?: string | null) => void

function createEventId() {
  return randomString()
}

export const Analytics = {
  setIdentity(identityId: string) {
    activeIdentityId = identityId
  },

  setAgent(agent: Agent) {
    activeAgent = agent
  },

  registerConsumer(consumer: Consumer) {
    consumer(activeAgent, activeIdentityId)
  },

  track(event: string, props: Properties = {}) {
    fork(console.error)(() => undefined)(
      activeAgent.raiseIntent<void, TrackedEvent>({
        type: 'analytics:track',
        payload: {
          eventId: createEventId(),
          name: event,
          time: Date.now(),
          props,
        },
      })
    )
  },
}
