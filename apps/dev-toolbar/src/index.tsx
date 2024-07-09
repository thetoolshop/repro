import { Stats, Trace } from '@repro/diagnostics'
import { Agent, createLoopbackAgent, createPTPAgent } from '@repro/messaging'
import { resolve } from 'fluture'
import { attach, detach, usingAgent } from './ToolshopDevToolbar'

declare global {
  const __BUILD_VERSION__: string | undefined
}

const standalone = process.env.MODE === 'standalone'

console.log('Repro build version:', __BUILD_VERSION__)
console.log('Repro build mode:', process.env.MODE ?? '(default: extension)')

if (process.env.NODE_ENV === 'development') {
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

agent.subscribeToIntent('enable', () => {
  attach()
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
