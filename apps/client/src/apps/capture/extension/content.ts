import { SyntheticId } from '@repro/domain'
import { createPTPAgent } from '~/libs/messaging'
import { createRuntimeAgent } from './createRuntimeAgent'

let scriptElement: HTMLScriptElement | null = null

const inPageAgent = createPTPAgent()
const runtimeAgent = createRuntimeAgent()

function addPageScript() {
  return new Promise(resolve => {
    if (scriptElement && scriptElement.isConnected) {
      resolve(null)
      return
    }

    scriptElement = document.createElement('script')
    scriptElement.src = chrome.runtime.getURL('capture.js')
    scriptElement.onload = resolve

    document.body.appendChild(scriptElement)
  })
}

async function enableDevTools() {
  await addPageScript()
  inPageAgent.raiseIntent({ type: 'enable' })
}

async function disableDevTools() {
  inPageAgent.raiseIntent({ type: 'disable' })
}

interface UploadPayload {
  id: SyntheticId
  recording: Array<number>
  assets: Array<never>
}

inPageAgent.subscribeToIntent('upload', (payload: UploadPayload) => {
  return runtimeAgent.raiseIntent({
    type: 'upload',
    payload,
  })
})

interface TrackPayload {
  event: string
  time: number
  props: Record<string, string>
}

inPageAgent.subscribeToIntent('analytics:track', (payload: TrackPayload) => {
  return runtimeAgent.raiseIntent({
    type: 'analytics:track',
    payload,
  })
})

runtimeAgent.subscribeToIntent('enable', async () => {
  enableDevTools()
  return true
})

runtimeAgent.subscribeToIntent('disable', async () => {
  disableDevTools()
  return true
})

export {}
