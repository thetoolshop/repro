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

import { AuthProvider, SessionRouteBoundary } from '@repro/auth'
import { PortalRootProvider } from '@repro/design'
import { AuthLayout } from './AuthLayout'
import { LoginRoute } from './routes/LoginRoute'
import { RegisterRoute } from './routes/RegisterRoute'

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

  // Use the app URL if provided, otherwise check if we're on app.repro.localhost
  const basename = process.env.REPRO_APP_URL
    ? new URL(process.env.REPRO_APP_URL).pathname
    : window.location.hostname === 'app.repro.localhost' ? '/w' : undefined

  root.render(
    <BrowserRouter basename={basename}>
      <ApiProvider>
        <AuthProvider>
          <PortalRootProvider>
            <Routes>
              <Route path="/" element={<MainRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="account/login" element={<LoginRoute />} />
                  <Route path="account/register" element={<RegisterRoute />} />
                  <Route path="account/verify" element={<div />} />

                  {/* <Route */}
                  {/*   path="account/accept-invitation" */}
                  {/*   element={<AcceptInvitationRoute />} */}
                  {/* /> */}
                </Route>

                <Route element={<Layout />}>
                  <Route element={<SessionRouteBoundary />}>
                    <Route index element={<HomeRoute />} />
                    <Route
                      path="recordings/:recordingId"
                      element={<RecordingRoute />}
                    />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </PortalRootProvider>
        </AuthProvider>
      </ApiProvider>
    </BrowserRouter>
  )
}
