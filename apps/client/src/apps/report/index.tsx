import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { applyResetStyles } from '~/config/theme'
import { Analytics } from '~/libs/analytics'
import { register as browserConsumer } from '~/libs/analytics/browser'
import { Stats, Trace } from '~/libs/diagnostics'
import { DEFAULT_AGENT } from '~/libs/messaging'
import { StateProvider } from './context'
import { createState } from './createState'
import { Controller } from './Controller'
import { DevTools } from './DevTools'
import { Preview } from './Preview'
import { SourceContainer } from './SourceContainer'

if (process.env.NODE_ENV === 'development') {
  Stats.enable()
  Trace.enable()
}

Analytics.setAgent(DEFAULT_AGENT)
Analytics.registerConsumer(browserConsumer)

const state = createState({
  inspecting: true,
})

const rootSelector = '#root'
const rootStyleSheet = document.querySelector<HTMLStyleElement>('#root-styles')

if (rootStyleSheet) {
  applyResetStyles(rootSelector, rootStyleSheet)
}

declare global {
  interface Window {
    __REPRO_STANDALONE: boolean
  }
}

window.__REPRO_STANDALONE = true

ReactDOM.render(
  <StateProvider state={state}>
    <BrowserRouter>
      <Routes>
        <Route
          path=":sourceId"
          element={
            <SourceContainer baseUrl={process.env.SHARE_API_URL || ''} />
          }
        >
          <Route element={<Controller />}>
            <Route index={true} element={<Preview />} />
            <Route
              path="devtools"
              element={
                <DevTools
                  disableExport={true}
                  disableToggle={true}
                  hideLogo={true}
                />
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StateProvider>,
  document.querySelector(rootSelector)
)
