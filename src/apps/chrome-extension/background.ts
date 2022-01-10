const StorageKeys = {
  ENABLED: 'enabled',
}

chrome.runtime.onStartup.addListener(() => {
  // Treat local storage as session storage
  // TODO: support session and persistent storage
  chrome.storage.local.clear()
})

chrome.runtime.onConnect.addListener(() => {
  ;(async function () {
    const tab = await getActiveTab()

    if (tab.id && (await isEnabled(tab.id))) {
      enable()
    }
  })()
})

chrome.action.onClicked.addListener(() => {
  toggle()
})

async function enable() {
  const tab = await getActiveTab()

  if (tab.id) {
    showActionBadge(tab.id)
    chrome.tabs.sendMessage(tab.id, { action: 'enable' })
    chrome.storage.local.set({
      [`${StorageKeys.ENABLED}:${tab.id}`]: true,
    })
  }
}

async function disable() {
  const tab = await getActiveTab()

  if (tab.id) {
    hideActionBadge(tab.id)
    chrome.tabs.sendMessage(tab.id, { action: 'disable' })
    chrome.storage.local.set({
      [`${StorageKeys.ENABLED}:${tab.id}`]: false,
    })
  }
}

function isEnabled(tabId: number): Promise<boolean> {
  return new Promise(resolve => {
    chrome.storage.local.get([`${StorageKeys.ENABLED}:${tabId}`], result => {
      resolve(result[`${StorageKeys.ENABLED}:${tabId}`] || false)
    })
  })
}

async function toggle() {
  const tab = await getActiveTab()

  if (tab.id && (await isEnabled(tab.id))) {
    disable()
  } else {
    enable()
  }
}

async function getActiveTab() {
  return new Promise<chrome.tabs.Tab>((resolve, reject) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      const activeTab = tabs[0]

      if (activeTab) {
        resolve(activeTab)
      } else {
        reject()
      }
    })
  })
}

function showActionBadge(tabId: number) {
  return Promise.all([
    chrome.action.setBadgeText({ tabId, text: 'on' }),
    chrome.action.setBadgeBackgroundColor({ tabId, color: [128, 128, 128, 1] }),
  ])
}

function hideActionBadge(tabId: number) {
  return Promise.all([
    chrome.action.setBadgeText({ tabId, text: '' }),
    chrome.action.setBadgeBackgroundColor({ tabId, color: [0, 0, 0, 0] }),
  ])
}

export {}
