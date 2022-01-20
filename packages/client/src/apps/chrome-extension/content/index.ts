import { GLOBAL_CHANNEL_NAME } from '@/config/constants'

let scriptElement: HTMLScriptElement | null = null

const messageBus = new BroadcastChannel(GLOBAL_CHANNEL_NAME)

function addPageScript() {
  return new Promise(resolve => {
    if (scriptElement && scriptElement.isConnected) {
      resolve(null)
      return
    }

    scriptElement = document.createElement('script')
    scriptElement.src = chrome.runtime.getURL('devtools.js')
    scriptElement.onload = resolve

    document.body.appendChild(scriptElement)
  })
}

async function enableDevTools() {
  await addPageScript()
  messageBus.postMessage({
    action: 'enable',
  })
}

async function disableDevTools() {
  messageBus.postMessage({
    action: 'disable',
  })
}

interface Message {
  action: string
  value: any
}

function onMessage(
  message: Message,
  _: chrome.runtime.MessageSender,
  sendResponse: (response: boolean) => void
) {
  switch (message.action) {
    case 'enable':
      enableDevTools()
      break

    case 'disable':
      disableDevTools()
      break
  }

  sendResponse(true)
}

chrome.runtime.onMessage.addListener(onMessage)
chrome.runtime.connect({ name: 'bridge' })

export {}
