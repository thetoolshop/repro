import { Analytics } from '@repro/analytics'
import { mixpanelBrowser } from '@repro/analytics-provider-mixpanel'
import { ApiProvider } from '@repro/api-client'
import { createPortalRoot } from '@repro/design'
import { Stats } from '@repro/diagnostics'
import { DEFAULT_AGENT } from '@repro/messaging'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { applyResetStyles } from '~/config/theme'
import { BillingProvider } from '~/libs/billing'

import { Layout } from './Layout'

import { HomeRoute } from './routes/HomeRoute'
import { LoginRoute } from './routes/LoginRoute'
import { MainRoute } from './routes/MainRoute'
import { RecordingRoute } from './routes/RecordingRoute'
import { SignUpRoute } from './routes/SignUpRoute'
// import { ResetPasswordRoute } from './routes/ResetPasswordRoute'

import { SessionProvider } from '~/libs/auth/Session'
import { RequireSession } from '~/libs/auth/Session/RequireSession'
import { AuthLayout } from './AuthLayout'

declare global {
  interface Window {
    __REPRO_STANDALONE: boolean
  }
}

window.__REPRO_STANDALONE = true

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

createPortalRoot()

if (rootElem) {
  const root = createRoot(rootElem)

  const basename = process.env.REPRO_APP_URL
    ? new URL(process.env.REPRO_APP_URL).pathname
    : undefined

  root.render(
    <ApiProvider>
      <BillingProvider>
        <SessionProvider>
          <BrowserRouter basename={basename}>
            <Routes>
              <Route path="/" element={<MainRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="account/login" element={<LoginRoute />} />
                  <Route path="account/signup" element={<SignUpRoute />} />
                  {/* <Route */}
                  {/*   path="account/reset-password" */}
                  {/*   element={<ResetPasswordRoute />} */}
                  {/* /> */}
                </Route>

                <Route element={<Layout />}>
                  <Route
                    index
                    element={
                      <RequireSession>
                        <HomeRoute />
                      </RequireSession>
                    }
                  />
                  <Route
                    path="recordings/:recordingId"
                    element={<RecordingRoute />}
                  />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </SessionProvider>
      </BillingProvider>
    </ApiProvider>
  )
}
