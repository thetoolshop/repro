import Future, { chain } from 'fluture'
import { createPTPAgent } from '@repro/messaging'
import { createRuntimeAgent } from './createRuntimeAgent'

let scriptElement: HTMLScriptElement | null = null

const inPageAgent = createPTPAgent()
const runtimeAgent = createRuntimeAgent()

function addPageScript() {
  return Future<any, unknown>((reject, resolve) => {
    if (scriptElement && scriptElement.isConnected) {
      resolve(null)
    } else {
      scriptElement = document.createElement('script')
      scriptElement.src = chrome.runtime.getURL('capture.js')
      scriptElement.onerror = reject
      scriptElement.onload = resolve

      document.head.appendChild(scriptElement)
    }

    return () => {}
  })
}

runtimeAgent.subscribeToIntent('enable', () => {
  return addPageScript().pipe(
    chain(() => inPageAgent.raiseIntent({ type: 'enable' }))
  )
})

runtimeAgent.subscribeToIntentAndForward('disable', inPageAgent)

inPageAgent.subscribeToIntentAndForward('upload', runtimeAgent)
inPageAgent.subscribeToIntentAndForward('api:call', runtimeAgent)
inPageAgent.subscribeToIntentAndForward('analytics:track', runtimeAgent)

export {}
