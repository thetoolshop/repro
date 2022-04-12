import { nanoid } from 'nanoid'
import { Agent, DEFAULT_AGENT } from '@/libs/messaging'
import * as browser from './browser'
import * as httpApi from './http-api'
import { TrackedEvent } from './types'

type Properties = Record<string, string>

let activeAgent: Agent = DEFAULT_AGENT
let activeIdentityId: string | null = null

const modules = {
  browser,
  httpApi,
}

function createEventId() {
  return nanoid()
}

export const Analytics = {
  setIdentity(identityId: string) {
    activeIdentityId = identityId
  },

  setAgent(agent: Agent) {
    activeAgent = agent
  },

  registerConsumer(name: keyof typeof modules) {
    const module = modules[name]
    module.register(activeAgent, activeIdentityId)
  },

  track(event: string, props: Properties = {}) {
    activeAgent.raiseIntent<'analytics:track', TrackedEvent, void>({
      type: 'analytics:track',
      payload: {
        eventId: createEventId(),
        name: event,
        time: Date.now(),
        props,
      },
    })
  },
}
