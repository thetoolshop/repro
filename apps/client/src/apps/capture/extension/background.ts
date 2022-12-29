import { ApiClient, createApiClient } from '@repro/api-client'
import { SourceEventView } from '@repro/domain'
import {
  and,
  attemptP,
  chain,
  fork,
  FutureInstance,
  node,
  reject,
  resolve,
} from 'fluture'
import { nanoid } from 'nanoid/non-secure'
import { Analytics } from '~/libs/analytics'
import { register as httpApiConsumer } from '~/libs/analytics/http-api'
import { createRuntimeAgent } from './createRuntimeAgent'

function run<L, R>(source: FutureInstance<L, R>, resolve = console.log) {
  return source.pipe(fork<L>(console.error)<R>(resolve))
}

const StorageKeys = {
  INSTALLER_ID: 'installed_id',
  ENABLED: 'enabled',
}

const agent = createRuntimeAgent()

function getInstallerId() {
  return node<unknown, string>(done => {
    chrome.storage.local.get([StorageKeys.INSTALLER_ID], result => {
      if (result[StorageKeys.INSTALLER_ID]) {
        resolve(result[StorageKeys.INSTALLER_ID])
        return
      }

      const installerId = nanoid()

      chrome.storage.local.set({
        [StorageKeys.INSTALLER_ID]: installerId,
      })

      done(null, installerId)
    })
  })
}

function setUpAnalytics() {
  return run(getInstallerId(), installerId => {
    Analytics.setIdentity(installerId)
    Analytics.setAgent(agent)
    Analytics.registerConsumer(httpApiConsumer)
  })
}

setUpAnalytics()

const apiClient = createApiClient({
  baseUrl: process.env.REPRO_API_URL || '',
  authStorage: (process.env.AUTH_STORAGE as any) || 'local-storage',
})

agent.subscribeToIntent('api:call', ({ namespace, method, args = [] }) => {
  if (namespace in apiClient) {
    const mod = apiClient[namespace as keyof ApiClient]

    if (method in mod) {
      // TODO: work out how to broadly type this
      // @ts-ignore
      const fn = mod[method]

      if (fn) {
        return fn(...args)
      }
    }
  }

  return reject({
    name: 'BadRequestError',
    message: `Could not find API method "${method}" for namespace "${namespace}"`,
  })
})

agent.subscribeToIntent('upload', (payload: any) => {
  return apiClient.recording.saveRecording(
    payload.recordingId,
    payload.title,
    payload.description,
    payload.projectId,
    payload.duration,
    payload.mode,
    payload.events.map(SourceEventView.deserialize),
    payload.context
  ) as FutureInstance<Error, void>
})

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

  const tab = resolve<boolean>(changeInfo.status === 'complete').pipe(
    chain(isComplete =>
      isComplete ? syncTab(tabId) : resolve<void>(undefined)
    )
  )

  return run(actionState.pipe(and(tab)), () => {
    console.debug('LIFECYCLE: on-updated')
  })
})

function syncActionState(): FutureInstance<unknown, void> {
  return isEnabled().pipe(
    chain(enabled => (enabled ? showActionBadge() : hideActionBadge()))
  )
}

function getActiveTabId(): FutureInstance<unknown, number | null> {
  return node(done => {
    chrome.tabs.query({ active: true }, result => {
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
  ).pipe(chain(() => (enabled ? showActionBadge() : hideActionBadge())))
}

function isFirstRun(): FutureInstance<unknown, boolean> {
  return node(done => {
    chrome.storage.local.get([StorageKeys.ENABLED], result => {
      done(null, result[StorageKeys.ENABLED] === undefined)
    })
  })
}

function showActionBadge(): FutureInstance<unknown, void> {
  return attemptP(() =>
    Promise.all([
      chrome.action.setBadgeText({ text: 'on' }),
      chrome.action.setBadgeBackgroundColor({ color: [0, 69, 133, 1] }),
    ]).then(() => undefined)
  )
}

function hideActionBadge(): FutureInstance<unknown, void> {
  return attemptP(() =>
    Promise.all([
      chrome.action.setBadgeText({ text: '' }),
      chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 0] }),
    ]).then(() => undefined)
  )
}

export {}
