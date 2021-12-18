// TODO: Support toggle by action click
chrome.runtime.onConnect.addListener(() => {
  enable()
})

async function enable() {
  const tab = await getActiveTab()

  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'enable' })
  }
}

// @ts-ignore
async function disable() {
  const tab = await getActiveTab()

  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'disable' })
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

export {}
