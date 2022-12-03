import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { createPortalRoot } from '~/components/Portal'
import { applyResetStyles } from '~/config/theme'
import { Analytics } from '~/libs/analytics'
import { ApiProvider } from '~/libs/api'
import { BillingProvider } from '~/libs/billing'
import { register as browserConsumer } from '~/libs/analytics/browser'
import { Stats } from '~/libs/diagnostics'
import { DEFAULT_AGENT } from '~/libs/messaging'

import { AuthBoundary } from './AuthBoundary'
import { Layout } from './Layout'

import { HomeRoute } from './routes/HomeRoute'
import { LoginRoute } from './routes/LoginRoute'
import { MainRoute } from './routes/MainRoute'
import { RecordingRoute } from './routes/RecordingRoute'
import { SignUpRoute } from './routes/SignUpRoute'
import { ResetPasswordRoute } from './routes/ResetPasswordRoute'

import { GlobalStateProvider } from './state'
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
Analytics.registerConsumer(browserConsumer)

const rootSelector = '#root'
const rootElem = document.querySelector(rootSelector)
const rootStyleSheet = document.querySelector<HTMLStyleElement>('#root-styles')

if (rootStyleSheet) {
  applyResetStyles(rootSelector, rootStyleSheet)
}

createPortalRoot()

if (rootElem) {
  const root = createRoot(rootElem)
  root.render(
    <ApiProvider>
      <BillingProvider>
        <GlobalStateProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="account/login" element={<LoginRoute />} />
                  <Route path="account/signup" element={<SignUpRoute />} />
                  <Route
                    path="account/reset-password"
                    element={<ResetPasswordRoute />}
                  />
                </Route>

                <Route element={<AuthBoundary />}>
                  <Route element={<Layout />}>
                    <Route index element={<HomeRoute />} />
                    <Route
                      path="recordings/:recordingId"
                      element={<RecordingRoute />}
                    />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </GlobalStateProvider>
      </BillingProvider>
    </ApiProvider>
  )
}
