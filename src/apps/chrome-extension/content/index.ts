let scriptElement: HTMLScriptElement | null = null

function addPageScript() {
  if (scriptElement && scriptElement.isConnected) {
    return
  }

  scriptElement = document.createElement('script')
  scriptElement.src = chrome.runtime.getURL('devtools.js')
  document.body.appendChild(scriptElement)
}

function removePageScript() {
  if (scriptElement) {
    scriptElement.remove()
    scriptElement = null
  }
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
      addPageScript()
      sendResponse(true)
      break

    case 'disable':
      removePageScript()
      sendResponse(true)
      break
  }
}

chrome.runtime.onMessage.addListener(onMessage)
chrome.runtime.connect({ name: 'bridge' })

export {}
