import { cache as styleCache } from '@jsxstyle/react'
import { PortalRootProvider } from '@repro/design'
import { Agent, MessagingProvider, createLoopbackAgent } from '@repro/messaging'
import {
  RecordingStreamProvider,
  createRecordingStream,
} from '@repro/recording'
import { applyResetStyles } from '@repro/theme'
import React from 'react'
import { Root, createRoot } from 'react-dom/client'
import { Controller } from './Controller'
import { TOOLBAR_ROOT_ID } from './constants'
import { StateProvider } from './context'
import { createState } from './createState'

const NODE_NAME = 'repro-dev-toolbar'

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

let agent = createLoopbackAgent()

export function usingAgent(a: Agent) {
  agent = a
}

class ReproDevToolbar extends HTMLElement {
  private renderRoot: Root | null = null
  private state = createState()

  public connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: 'closed' })

    const rootElem = document.createElement('div')
    rootElem.id = TOOLBAR_ROOT_ID
    this.renderRoot = createRoot(rootElem)

    const styleRoot = document.createElement('style')
    refs.activeStyleRoot = styleRoot

    styleCache.reset()

    shadowRoot.appendChild(styleRoot)
    shadowRoot.appendChild(rootElem)

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
      applyResetStyles(`#${TOOLBAR_ROOT_ID}`, refs.activeStyleRoot)
    }

    this.renderRoot.render(
      <PortalRootProvider>
        <RecordingStreamProvider stream={stream}>
          <StateProvider state={this.state}>
            <MessagingProvider agent={agent}>
              <Controller />
            </MessagingProvider>
          </StateProvider>
        </RecordingStreamProvider>
      </PortalRootProvider>
    )
  }

  public disconnectedCallback() {
    this.renderRoot?.unmount()
  }
}

export function attach() {
  if (!window.customElements.get(NODE_NAME)) {
    window.customElements.define(NODE_NAME, ReproDevToolbar)
  }

  if (!document.querySelector(NODE_NAME)) {
    const root = new ReproDevToolbar()
    document.body.appendChild(root)
  }
}

export function detach() {
  const root = document.querySelector(NODE_NAME)

  if (root) {
    root.remove()
  }
}
