import { PortalRootProvider } from '@repro/design'
import { Stats } from '@repro/diagnostics'
import { applyResetStyles } from '@repro/theme'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomeRoute } from './HomeRoute'
import { RecordingRoute } from './RecordingRoute'

declare global {
  interface Window {
    __REPRO_USING_SDK: boolean
  }
}

window.__REPRO_USING_SDK = true

if (process.env.BUILD_ENV === 'development') {
  Stats.enable()
}

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
    <PortalRootProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route index element={<HomeRoute />} />
          <Route path=":recordingId" element={<RecordingRoute />} />
        </Routes>
      </BrowserRouter>
    </PortalRootProvider>
  )
}
