import { createPTPAgent } from '@repro/messaging'
import Future, { chain } from 'fluture'
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
      scriptElement.src = chrome.runtime.getURL('page.js')
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

export {}
