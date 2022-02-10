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

const API_BASE_URL = 'http://localhost:8787'

const state = createState({
  inspecting: true,
})

const rootSelector = '#root'
const rootStyleSheet = document.querySelector<HTMLStyleElement>('#root-styles')

if (rootStyleSheet) {
  applyResetStyles(rootSelector, rootStyleSheet)
}

ReactDOM.render(
  <StateProvider state={state}>
    <BrowserRouter>
      <Routes>
        <Route
          path=":sourceId"
          element={<SourceContainer baseUrl={API_BASE_URL} />}
        >
          <Route element={<StandaloneController />}>
            <Route index={true} element={<Preview />} />
            <Route
              path="devtools"
              element={<DevTools disableExport={true} disableToggle={true} />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StateProvider>,
  document.querySelector(rootSelector)
)
