import '@/config/theme/fonts'

import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { applyResetStyles } from '@/config/theme'
import { StateProvider } from './context'
import { createState } from './createState'
import { DevTools } from './DevTools'
import { Preview } from './Preview'
import { SourceContainer } from './SourceContainer'
import { StandaloneController } from './StandaloneController'

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
          <Route element={<StandaloneController />}>
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
