import '@/config/theme/fonts'

import { applyResetStyles } from '@/config/theme'
import { Stats, Trace } from '@/libs/diagnostics'
import { createPTPAgent, MessagingProvider } from '@/libs/messaging'
import { createRecordingStream, RecordingStreamProvider } from '@/libs/record'
import { cache as styleCache } from 'jsxstyle'
import React from 'react'
import ReactDOM from 'react-dom'
import { REPRO_ROOT_ID } from './constants'
import { StateProvider } from './context'
import { createState } from './createState'
import { EmbeddedController } from './EmbeddedController'

Stats.enable()
Trace.enable()

const NODE_NAME = 'repro-devtools'

// jsxstyle prevents multiple invocations of `cache.injectOptions`,
// so we cannot register a new style root per custom element.
// We must keep track of the active style root in global context instead.
// NB: if we need to support multiple instances, this could hold
// WeakMap<ReproDevTools, HTMLStyleElement>
interface Refs {
  activeStyleRoot: HTMLStyleElement | null
}

const refs: Refs = {
  activeStyleRoot: null,
}

const _initialInjectOptions = styleCache.injectOptions

// Should PTP agent replace Broadcast agent?
const agent = createPTPAgent()

class ReproDevTools extends HTMLElement {
  private renderRoot: HTMLDivElement
  private state = createState()

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'closed' })

    const renderRoot = (this.renderRoot = document.createElement('div'))
    renderRoot.id = REPRO_ROOT_ID

    const styleRoot = document.createElement('style')
    refs.activeStyleRoot = styleRoot

    shadowRoot.appendChild(styleRoot)
    shadowRoot.appendChild(renderRoot)

    styleCache.reset()
    styleCache.injectOptions = _initialInjectOptions
    // TODO: build and bundle css for prod
    styleCache.injectOptions({
      onInsertRule(rule) {
        if (refs.activeStyleRoot) {
          const sheet = refs.activeStyleRoot.sheet

          if (sheet) {
            sheet.insertRule(rule, sheet.cssRules.length)
          }
        }
      },
    })
  }

  public connectedCallback() {
    const ignoredSelectors = [NODE_NAME, '.repro-ignore']
    const ignoredNodes: Array<Node> = []

    if (this.shadowRoot) {
      ignoredNodes.push(this.shadowRoot)
    }

    if (document.currentScript) {
      ignoredNodes.push(document.currentScript)
    }

    const stream = createRecordingStream(document, {
      types: new Set(['dom', 'interaction']),
      ignoredNodes,
      ignoredSelectors,
    })

    if (refs.activeStyleRoot) {
      applyResetStyles(`#${REPRO_ROOT_ID}`, refs.activeStyleRoot)
    }

    ReactDOM.render(
      <RecordingStreamProvider stream={stream}>
        <StateProvider state={this.state}>
          <MessagingProvider agent={agent}>
            <EmbeddedController />
          </MessagingProvider>
        </StateProvider>
      </RecordingStreamProvider>,
      this.renderRoot
    )
  }

  public disconnectedCallback() {
    ReactDOM.unmountComponentAtNode(this.renderRoot)
  }
}

declare global {
  interface Window {
    __REPRO_STANDALONE: boolean
  }
}

if (!window.__REPRO_STANDALONE) {
  agent.subscribeToIntent('enable', async () => {
    if (!window.customElements.get(NODE_NAME)) {
      window.customElements.define(NODE_NAME, ReproDevTools)
    }

    if (!document.querySelector(NODE_NAME)) {
      const devtools = document.createElement(NODE_NAME)
      document.body.appendChild(devtools)
    }
  })

  agent.subscribeToIntent('disable', async () => {
    const root = document.querySelector(NODE_NAME)

    if (root) {
      root.remove()
    }
  })
}
