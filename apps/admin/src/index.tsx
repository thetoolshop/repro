import { ApiProvider } from '@repro/api-client'
import { applyResetStyles } from '@repro/theme'
import React from 'react'
import { createRoot } from 'react-dom/client'

import { PortalRootProvider } from '@repro/design'
import { HomeRoute } from './routes/HomeRoute'

declare global {
  interface Window {
    __REPRO_STANDALONE: boolean
  }
}

window.__REPRO_STANDALONE = true

const rootSelector = '#root'
const rootElem = document.querySelector(rootSelector)
const rootStyleSheet = document.querySelector<HTMLStyleElement>('#root-styles')

if (rootStyleSheet) {
  applyResetStyles(rootSelector, rootStyleSheet)
}

if (rootElem) {
  const root = createRoot(rootElem)

  root.render(
    <ApiProvider>
      <PortalRootProvider>
        <HomeRoute />
      </PortalRootProvider>
    </ApiProvider>
  )
}
