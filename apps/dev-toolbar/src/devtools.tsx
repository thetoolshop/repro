import { applyResetStyles } from '@repro/theme'
import { createRoot } from 'react-dom/client'

const rootSelector = '#root'
const rootElem = document.querySelector(rootSelector)
const rootStyleSheet = document.querySelector<HTMLStyleElement>('#root-styles')

if (rootStyleSheet) {
  applyResetStyles(rootSelector, rootStyleSheet)
}

if (rootElem) {
  const root = createRoot(rootElem)
  root.render(<DevtoolsContainer />)
}
