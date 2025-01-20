import { Analytics, stubConsumer } from '@repro/analytics'
import { createApiClient } from '@repro/api-client'
import { RecordingMode, SourceEventView } from '@repro/domain'
import { createUploadWorker } from '@repro/recording-api'
import { parseSchema } from '@repro/validation'
import { fromByteString } from '@repro/wire-formats'
import {
  FutureInstance,
  and,
  attemptP,
  chain,
  fork,
  map,
  resolve,
} from 'fluture'
import browser from 'webextension-polyfill'
import z from 'zod'
import { createRuntimeAgent } from './createRuntimeAgent'

function run<L, R>(source: FutureInstance<L, R>, resolve = console.log) {
  return source.pipe(fork<L>(console.error)<R>(resolve))
}

const StorageKeys = {
  INSTALLER_ID: 'installed_id',
  ENABLED: 'enabled',
}

const agent = createRuntimeAgent()

Analytics.setAgent(agent)
Analytics.registerConsumer(stubConsumer)

const apiClient = createApiClient({
  baseUrl: process.env.REPRO_API_URL || '',
  authStorage: (process.env.AUTH_STORAGE as any) || 'local-storage',
})

const uploadWorker = createUploadWorker(apiClient, {
  withEncryptionScheme: 'key',
})

const UploadEnqueuePayloadSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string(),
  mode: z.nativeEnum(RecordingMode),
  duration: z.number(),
  events: z.array(z.string()),
  browserName: z.string().nullable(),
  browserVersion: z.string().nullable(),
  operatingSystem: z.string().nullable(),
})

type UploadEnqueuePayload = z.infer<typeof UploadEnqueuePayloadSchema>

agent.subscribeToIntent('upload:enqueue', (payload: UploadEnqueuePayload) => {
  return parseSchema(UploadEnqueuePayloadSchema, payload).pipe(
    map(input =>
      uploadWorker.enqueue({
        ...input,
        events: input.events.map(byteString =>
          SourceEventView.over(new DataView(fromByteString(byteString).buffer))
        ),
      })
    )
  )
})

const UploadProgressPayloadSchema = z.object({
  ref: z.string(),
})

type UploadProgressPayload = z.infer<typeof UploadProgressPayloadSchema>

agent.subscribeToIntent('upload:progress', (payload: UploadProgressPayload) => {
  return parseSchema(UploadProgressPayloadSchema, payload).pipe(
    map(({ ref }) => uploadWorker.getProgress(ref))
  )
})

browser.runtime.onInstalled.addListener(() => {
  const source = isFirstRun().pipe(
    chain(firstRun =>
      firstRun ? setEnabledState(true) : resolve<void>(undefined)
    )
  )

  return run(source.pipe(and(syncActionState())), () => {
    console.debug('LIFECYCLE: on-installed')
  })
})

browser.runtime.onStartup.addListener(() => {
  return run(syncActionState(), () => {
    console.debug('LIFECYCLE: on-startup')
  })
})

browser.action.onClicked.addListener(() => {
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

browser.tabs.onActivated.addListener(({ tabId }) => {
  return run(syncTab(tabId), result => {
    console.debug('LIFECYCLE: on-activated', result)
  })
})

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
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
    chain(enabled => (enabled ? showActiveIcon() : showInactiveIcon()))
  )
}

function getActiveTabId(): FutureInstance<unknown, number | null> {
  return attemptP(() =>
    browser.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then(result => {
        const activeTabId = result[0]?.id
        return activeTabId ?? null
      })
  )
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
  return attemptP(() =>
    browser.storage.local.get([StorageKeys.ENABLED]).then(result => {
      return !!result[StorageKeys.ENABLED]
    })
  )
}

function toggleEnabledState() {
  return isEnabled().pipe(chain(enabled => setEnabledState(!enabled)))
}

function setEnabledState(enabled: boolean) {
  return attemptP(() =>
    browser.storage.local.set({
      [StorageKeys.ENABLED]: enabled,
    })
  ).pipe(chain(() => (enabled ? showActiveIcon() : showInactiveIcon())))
}

function isFirstRun(): FutureInstance<unknown, boolean> {
  return attemptP(() =>
    browser.storage.local.get([StorageKeys.ENABLED]).then(result => {
      return result[StorageKeys.ENABLED] === undefined
    })
  )
}

function showActiveIcon(): FutureInstance<unknown, void> {
  return attemptP(() =>
    browser.action.setIcon({
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
  return attemptP(() =>
    browser.action.setIcon({
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
