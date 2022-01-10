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
        showActionBadge()
        chrome.tabs.sendMessage(tab.id, { action: 'enable' })
        chrome.storage.local.set({
          [StorageKeys.ENABLED]: true,
        })
      }
    }
  })
}

async function disableAll() {
  chrome.tabs.query({}, tabs => {
    for (const tab of tabs) {
      if (tab.id) {
        hideActionBadge()
        chrome.tabs.sendMessage(tab.id, { action: 'disable' })
        chrome.storage.local.set({
          [StorageKeys.ENABLED]: false,
        })
      }
    }
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
