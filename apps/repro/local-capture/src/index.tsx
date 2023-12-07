import { Stats, Trace } from '@repro/diagnostics'
import { createPTPAgent, MessagingProvider } from '@repro/messaging'
import {
  createRecordingStream,
  RecordingStreamProvider,
} from '@repro/recording'
import { applyResetStyles } from '@repro/theme'
import { resolve } from 'fluture'
import { cache as styleCache } from 'jsxstyle'
import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { REPRO_ROOT_ID } from './constants'
import { StateProvider } from './context'
import { Controller } from './Controller'
import { createState } from './createState'

if (process.env.NODE_ENV === 'development') {
  Stats.enable()
  Trace.enable()
}

const NODE_NAME = 'repro-local-capture'

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

class ToolshopDevToolbar extends HTMLElement {
  private renderRoot: Root
  private state = createState()

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'closed' })

    const rootElem = document.createElement('div')
    rootElem.id = REPRO_ROOT_ID
    this.renderRoot = createRoot(rootElem)

    const styleRoot = document.createElement('style')
    refs.activeStyleRoot = styleRoot

    shadowRoot.appendChild(styleRoot)
    shadowRoot.appendChild(rootElem)

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
    const ignoredSelectors = [NODE_NAME]
    const ignoredNodes: Array<Node> = []

    if (this.shadowRoot) {
      ignoredNodes.push(this.shadowRoot)
    }

    if (document.currentScript) {
      ignoredNodes.push(document.currentScript)
    }

    const stream = createRecordingStream(document, {
      types: new Set([
        'dom',
        'interaction',
        'network',
        'console',
        'performance',
      ]),
      ignoredNodes,
      ignoredSelectors,
    })

    if (refs.activeStyleRoot) {
      applyResetStyles(`#${REPRO_ROOT_ID}`, refs.activeStyleRoot)
    }

    this.renderRoot.render(
      <RecordingStreamProvider stream={stream}>
        <StateProvider state={this.state}>
          <MessagingProvider agent={agent}>
            <Controller />
          </MessagingProvider>
        </StateProvider>
      </RecordingStreamProvider>
    )
  }

  public disconnectedCallback() {
    this.renderRoot.unmount()
  }
}

agent.subscribeToIntent('enable', () => {
  if (!window.customElements.get(NODE_NAME)) {
    window.customElements.define(NODE_NAME, ToolshopDevToolbar)
  }

  if (!document.querySelector(NODE_NAME)) {
    const root = new ToolshopDevToolbar()
    document.body.appendChild(root)
  }

  return resolve<void>(undefined)
})

agent.subscribeToIntent('disable', () => {
  const root = document.querySelector(NODE_NAME)

  if (root) {
    root.remove()
  }

  return resolve<void>(undefined)
})
