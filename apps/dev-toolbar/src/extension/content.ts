import { logger } from '@repro/logger'
import { createPTPAgent } from '@repro/messaging'
import Future, { chain } from 'fluture'
import { createRuntimeAgent } from './createRuntimeAgent'

if (process.env.NODE_ENV === 'development') {
  logger.debug('Repro extension startup time:', performance.now())
}

let scriptElement: HTMLScriptElement | null = null

const inPageAgent = createPTPAgent()
const runtimeAgent = createRuntimeAgent()

function addPageScript() {
  return Future<any, unknown>((reject, resolve) => {
    if (scriptElement && scriptElement.isConnected) {
      resolve(null)
    } else {
      scriptElement = document.createElement('script')
      scriptElement.src = chrome.runtime.getURL('page.js')
      scriptElement.onerror = reject
      scriptElement.onload = resolve

      const parent = document.documentElement
      parent.insertBefore(scriptElement, parent.firstChild)
    }

    return () => {}
  })
}

runtimeAgent.subscribeToIntent('enable', payload => {
  return addPageScript().pipe(
    chain(() => inPageAgent.raiseIntent({ type: 'enable', payload }))
  )
})

runtimeAgent.subscribeToIntentAndForward('disable', inPageAgent)

inPageAgent.subscribeToIntentAndForward('set-recording-state', runtimeAgent)

export {}
