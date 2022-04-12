import { zlibSync } from 'fflate'
import { nanoid } from 'nanoid/non-secure'
import { Analytics } from '@/libs/analytics'
import { encrypt } from '@/libs/crypto'
import { createRuntimeAgent } from './createRuntimeAgent'

const StorageKeys = {
  INSTALLER_ID: 'installed_id',
  ENABLED: 'enabled',
}

const agent = createRuntimeAgent()

async function getInstallerId() {
  return new Promise<string>(resolve => {
    chrome.storage.local.get([StorageKeys.INSTALLER_ID], result => {
      if (result[StorageKeys.INSTALLER_ID]) {
        resolve(result[StorageKeys.INSTALLER_ID])
        return
      }

      const installerId = nanoid()

      chrome.storage.local.set({
        [StorageKeys.INSTALLER_ID]: installerId,
      })

      resolve(installerId)
    })
  })
}

async function setUpAnalytics() {
  const installerId = await getInstallerId()
  Analytics.setIdentity(installerId)
  Analytics.setAgent(agent)
  Analytics.registerConsumer('httpApi')
}

const shareApiUrl = (process.env.SHARE_API_URL || '').replace(/\/$/, '')

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

  const res = await fetch(`${shareApiUrl}/${payload.id}`, {
    method: 'PUT',
    body: formData,
  })

  if (res.ok) {
    return [true, `/${payload.id}#${encryptionKey}`]
  }

  return [false, null]
})

chrome.runtime.onConnect.addListener(() => {
  ;(async function () {
    await setUpAnalytics()

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
