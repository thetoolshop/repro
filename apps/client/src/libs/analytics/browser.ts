import { node } from 'fluture'
import mixpanel from 'mixpanel-browser'
import { Agent } from '@repro/messaging'
import { TrackedEvent } from './types'

export function register(agent: Agent, identityId: string | null = null) {
  mixpanel.init(process.env.MIXPANEL_TOKEN || '', {
    debug: process.env.BUILD_ENV === 'development',
  })

  if (identityId !== null) {
    mixpanel.identify(identityId)
  }

  agent.subscribeToIntent(
    'analytics:track',
    ({ name, time, props }: TrackedEvent) => {
      return node(done =>
        mixpanel.track(name, { time, ...props }, _ => {
          done(null)
        })
      )
    }
  )
}
