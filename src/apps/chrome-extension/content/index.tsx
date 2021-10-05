import React from 'react'
import ReactDOM from 'react-dom'
import { Stats, Trace } from '@/libs/diagnostics'
import { ViewProvider } from '../view'
import { App } from './App'
import { REPRO_ROOT_ID } from './constants'

Stats.on = false
Trace.on = true

const root = document.createElement('div')
root.id = REPRO_ROOT_ID
document.body.appendChild(root)

ReactDOM.render(
  <ViewProvider>
    <App />
  </ViewProvider>,
  root
)
