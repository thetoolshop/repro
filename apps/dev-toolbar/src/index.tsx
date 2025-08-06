import { Stats, Trace } from '@repro/diagnostics'
import { logger } from '@repro/logger'
import { Agent, createLoopbackAgent, createPTPAgent } from '@repro/messaging'
import { resolve } from 'fluture'
import { attach, detach, usingAgent } from './ReproDevToolbar'

declare global {
  const __BUILD_VERSION__: string | undefined
}

const standalone = process.env.MODE === 'standalone'

if (process.env.NODE_ENV === 'development') {
  logger.debug('Repro build version:', __BUILD_VERSION__)
  logger.debug('Repro build mode:', process.env.MODE ?? '(default: extension)')
  logger.debug('Repro page startup time:', performance.now())

  Stats.enable()
  Trace.enable()
}

let agent: Agent

switch (process.env.MODE) {
  case 'standalone':
    agent = createLoopbackAgent()
    break

  case 'extension':
  default:
    agent = createPTPAgent()
    break
}

usingAgent(agent)

agent.subscribeToIntent('enable', ({ recording }) => {
  attach(recording)
  return resolve<void>(undefined)
})

agent.subscribeToIntent('disable', () => {
  detach()
  return resolve<void>(undefined)
})

// Auto-start in standalone build
if (standalone) {
  agent.raiseIntent({
    type: 'enable',
  })
}
