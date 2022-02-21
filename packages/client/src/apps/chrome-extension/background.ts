import { zlibSync } from 'fflate'
import { encrypt } from '@/libs/crypto'
import { createRuntimeAgent } from './createRuntimeAgent'

const agent = createRuntimeAgent()

agent.subscribeToIntent('upload', async (payload: any) => {
  const compressed = zlibSync(new Uint8Array(payload.recording))
  const [data, encryptionKey] = await encrypt(compressed)

  const formData = new FormData()

  formData.set(
    'recording',
    new File([data], payload.id, {
      type: 'application/octet-stream',
    })
  )

  const res = await fetch(`http://localhost:8787/${payload.id}`, {
    method: 'PUT',
    body: formData,
  })

  if (res.ok) {
    return [true, `/${payload.id}#${encryptionKey}`]
  }

  return [false, null]
})

const StorageKeys = {
  ENABLED: 'enabled',
}

chrome.runtime.onConnect.addListener(() => {
  ;(async function () {
    const enabled = await isEnabled()

    if (enabled) {
      enableAll()
    }
  })()
})

chrome.action.onClicked.addListener(() => {
  toggleAll()
})

async function enableAll() {
  chrome.tabs.query({}, tabs => {
    for (const tab of tabs) {
      if (tab.id) {
        agent.raiseIntent({ type: 'enable' }, { target: tab.id })
      }
    }

    showActionBadge()
    chrome.storage.local.set({
      [StorageKeys.ENABLED]: true,
    })
  })
}

async function disableAll() {
  chrome.tabs.query({}, tabs => {
    for (const tab of tabs) {
      if (tab.id) {
        agent.raiseIntent({ type: 'disable' }, { target: tab.id })
      }
    }

    hideActionBadge()
    chrome.storage.local.set({
      [StorageKeys.ENABLED]: false,
    })
  })
}

function isEnabled(): Promise<boolean> {
  return new Promise(resolve => {
    chrome.storage.local.get([StorageKeys.ENABLED], result => {
      resolve(result[StorageKeys.ENABLED] || false)
    })
  })
}

async function toggleAll() {
  const enabled = await isEnabled()

  if (enabled) {
    disableAll()
  } else {
    enableAll()
  }
}

function showActionBadge() {
  return Promise.all([
    chrome.action.setBadgeText({ text: 'on' }),
    chrome.action.setBadgeBackgroundColor({ color: [128, 128, 128, 1] }),
  ])
}

function hideActionBadge() {
  return Promise.all([
    chrome.action.setBadgeText({ text: '' }),
    chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 0] }),
  ])
}

export {}
