import { zlibSync } from 'fflate'
import { nanoid } from 'nanoid/non-secure'
import { Analytics } from '~/libs/analytics'
import { register as httpApiConsumer } from '~/libs/analytics/http-api'
import { encrypt } from '~/libs/crypto'
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
  Analytics.registerConsumer(httpApiConsumer)
}

setUpAnalytics()

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

chrome.runtime.onInstalled.addListener(() => {
  ;(async function () {
    if (await isFirstRun()) {
      setEnabledState(true)
    }
  })()
})

chrome.runtime.onStartup.addListener(() => {
  ;(async function () {
    if (await isEnabled()) {
      showActionBadge()
    }
  })()
})

chrome.action.onClicked.addListener(() => {
  ;(async function () {
    await toggleEnabledState()

    const activeTabId = await getActiveTabId()

    if (activeTabId) {
      syncTab(activeTabId)
    }
  })()
})

chrome.tabs.onActivated.addListener(({ tabId }) => {
  syncTab(tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    syncTab(tabId)
  }
})

async function getActiveTabId() {
  return new Promise<number | null>(resolve => {
    chrome.tabs.query({ active: true }, result => {
      const activeTabId = result[0]?.id
      resolve(activeTabId ?? null)
    })
  })
}

async function syncTab(tabId: number) {
  try {
    if (await isEnabled()) {
      await enableInTab(tabId)
    } else {
      await disableInTab(tabId)
    }
  } catch (err) {
    console.log('syncTab error', err)
  }
}

async function enableInTab(tabId: number) {
  agent.raiseIntent({ type: 'enable' }, { target: tabId })
}

async function disableInTab(tabId: number) {
  agent.raiseIntent({ type: 'disable' }, { target: tabId })
}

function isEnabled(): Promise<boolean> {
  return new Promise(resolve => {
    chrome.storage.local.get([StorageKeys.ENABLED], result => {
      resolve(result[StorageKeys.ENABLED] || false)
    })
  })
}

async function toggleEnabledState() {
  const enabled = await isEnabled()
  await setEnabledState(!enabled)
}

async function setEnabledState(enabled: boolean) {
  await chrome.storage.local.set({
    [StorageKeys.ENABLED]: enabled,
  })

  if (enabled) {
    showActionBadge()
  } else {
    hideActionBadge()
  }
}

async function isFirstRun(): Promise<boolean> {
  return new Promise(resolve => {
    chrome.storage.local.get([StorageKeys.ENABLED], result => {
      resolve(result[StorageKeys.ENABLED] === undefined)
    })
  })
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
