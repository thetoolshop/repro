import {
  and,
  attempt,
  attemptP,
  chain,
  fork,
  FutureInstance,
  node,
  resolve,
} from 'fluture'
import { createRuntimeAgent } from './createRuntimeAgent'

function run<L, R>(source: FutureInstance<L, R>, resolve = console.log) {
  return source.pipe(fork<L>(console.error)<R>(resolve))
}

const StorageKeys = {
  INSTALLER_ID: 'installed_id',
  ENABLED: 'enabled',
}

const agent = createRuntimeAgent()

chrome.runtime.onInstalled.addListener(() => {
  const source = isFirstRun().pipe(
    chain(firstRun =>
      firstRun ? setEnabledState(true) : resolve<void>(undefined)
    )
  )

  return run(source.pipe(and(syncActionState())), () => {
    console.debug('LIFECYCLE: on-installed')
  })
})

chrome.runtime.onStartup.addListener(() => {
  return run(syncActionState(), () => {
    console.debug('LIFECYCLE: on-startup')
  })
})

chrome.action.onClicked.addListener(() => {
  const source = toggleEnabledState()
    .pipe(chain(() => getActiveTabId()))
    .pipe(
      chain(activeTabId =>
        activeTabId ? syncTab(activeTabId) : resolve<void>(undefined)
      )
    )

  return run(source, () => {
    console.debug('ACTION: toggle for active tab')
  })
})

chrome.tabs.onActivated.addListener(({ tabId }) => {
  return run(syncTab(tabId), result => {
    console.debug('LIFECYCLE: on-activated', result)
  })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  const actionState = syncActionState()

  const tab = resolve<boolean>(changeInfo.status === 'loading').pipe(
    chain(isReady => (isReady ? syncTab(tabId) : resolve<void>(undefined)))
  )

  return run(actionState.pipe(and(tab)), () => {
    console.debug('LIFECYCLE: on-updated')
  })
})

function syncActionState(): FutureInstance<unknown, void> {
  return isEnabled().pipe(
    chain(enabled => (enabled ? showActiveIcon() : showInactiveIcon()))
  )
}

function getActiveTabId(): FutureInstance<unknown, number | null> {
  return node(done => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, result => {
      const activeTabId = result[0]?.id
      done(null, activeTabId ?? null)
    })
  })
}

function syncTab(tabId: number) {
  return isEnabled().pipe(
    chain(enabled => (enabled ? enableInTab(tabId) : disableInTab(tabId)))
  )
}

function enableInTab(tabId: number) {
  return agent.raiseIntent({ type: 'enable' }, { target: tabId })
}

function disableInTab(tabId: number) {
  return agent.raiseIntent({ type: 'disable' }, { target: tabId })
}

function isEnabled(): FutureInstance<unknown, boolean> {
  return node(done => {
    chrome.storage.local.get([StorageKeys.ENABLED], result => {
      done(null, result[StorageKeys.ENABLED] || false)
    })
  })
}

function toggleEnabledState() {
  return isEnabled().pipe(chain(enabled => setEnabledState(!enabled)))
}

function setEnabledState(enabled: boolean) {
  return attemptP(() =>
    chrome.storage.local.set({
      [StorageKeys.ENABLED]: enabled,
    })
  ).pipe(chain(() => (enabled ? showActiveIcon() : showInactiveIcon())))
}

function isFirstRun(): FutureInstance<unknown, boolean> {
  return node(done => {
    chrome.storage.local.get([StorageKeys.ENABLED], result => {
      done(null, result[StorageKeys.ENABLED] === undefined)
    })
  })
}

function showActiveIcon(): FutureInstance<unknown, void> {
  return attempt(() =>
    chrome.action.setIcon({
      path: {
        128: 'logo-128.png',
        48: 'logo-48.png',
        32: 'logo-32.png',
        16: 'logo-16.png',
      },
    })
  )
}

function showInactiveIcon(): FutureInstance<unknown, void> {
  return attempt(() =>
    chrome.action.setIcon({
      path: {
        128: 'logo-inactive-128.png',
        48: 'logo-inactive-48.png',
        32: 'logo-inactive-32.png',
        16: 'logo-inactive-16.png',
      },
    })
  )
}

export {}
