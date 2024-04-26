import { Analytics } from '@repro/analytics'
import { mixpanelBrowser } from '@repro/analytics-provider-mixpanel'
import { ApiProvider } from '@repro/api-client'
import { Stats } from '@repro/diagnostics'
import { DEFAULT_AGENT } from '@repro/messaging'
import { applyResetStyles } from '@repro/theme'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { Layout } from './Layout'

import { HomeRoute } from './routes/HomeRoute'
import { MainRoute } from './routes/MainRoute'
import { RecordingRoute } from './routes/RecordingRoute'

import { PortalRootProvider } from '@repro/design'

declare global {
  interface Window {
    __REPRO_USING_SDK: boolean
  }
}

window.__REPRO_USING_SDK = true

if (process.env.BUILD_ENV === 'development') {
  Stats.enable()
}

Analytics.setAgent(DEFAULT_AGENT)
Analytics.registerConsumer(mixpanelBrowser)

const rootSelector = '#root'
const rootElem = document.querySelector(rootSelector)
const rootStyleSheet = document.querySelector<HTMLStyleElement>('#root-styles')

if (rootStyleSheet) {
  applyResetStyles(rootSelector, rootStyleSheet)
}

if (rootElem) {
  const root = createRoot(rootElem)

  const basename = process.env.REPRO_APP_URL
    ? new URL(process.env.REPRO_APP_URL).pathname
    : undefined

  root.render(
    <ApiProvider>
      <BrowserRouter basename={basename}>
        <PortalRootProvider>
          <Routes>
            <Route path="/" element={<MainRoute />}>
              <Route element={<Layout />}>
                <Route index element={<HomeRoute />} />
                <Route
                  path="recordings/:recordingId"
                  element={<RecordingRoute />}
                />
              </Route>
            </Route>
          </Routes>
        </PortalRootProvider>
      </BrowserRouter>
    </ApiProvider>
  )
}
