import { View } from './view'

chrome.action.onClicked.addListener(tab => {
  startRecording(tab)
})

async function startRecording(tab: chrome.tabs.Tab) {
  if (tab.id) {
    const hasContentScript = await announce(tab.id)

    if (!hasContentScript) {
      await loadContentScript(tab.id)
    }

    await setView(tab.id, View.Record)
  }
}

async function announce(tabId: number) {
  return new Promise<boolean>(resolve => {
    chrome.tabs.sendMessage(tabId, { action: 'announce' }, response => {
      resolve(response ? true : false)
    })
  })
}

async function loadContentScript(tabId: number) {
  return new Promise<void>(resolve => {
    chrome.scripting.executeScript(
      {
        files: ['content.js'],
        target: { tabId },
      },
      () => resolve()
    )
  })
}

async function setView(tabId: number, view: View) {
  return new Promise<void>(resolve => {
    chrome.tabs.sendMessage(
      tabId,
      {
        action: 'setView',
        value: view,
      },
      () => resolve()
    )
  })
}
