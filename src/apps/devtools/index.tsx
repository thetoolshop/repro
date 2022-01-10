import { applyResetStyles } from '@/config/theme'
import { Stats, Trace } from '@/libs/diagnostics'
import { createRecordingStream, RecordingStreamProvider } from '@/libs/record'
import { cache as styleCache } from 'jsxstyle'
import React from 'react'
import ReactDOM from 'react-dom'
import { REPRO_ROOT_ID } from './constants'
import { StateProvider } from './context'
import { createState } from './createState'
import { DevToolsContainer } from './DevToolsContainer'

Stats.enable()
Trace.enable()

const NODE_NAME = 'repro-devtools'

class ReproDevTools extends HTMLElement {
  private renderRoot: HTMLDivElement
  private styleRoot: HTMLStyleElement
  private state = createState()

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'closed' })

    const renderRoot = (this.renderRoot = document.createElement('div'))
    renderRoot.id = REPRO_ROOT_ID

    const styleRoot = (this.styleRoot = document.createElement('style'))

    shadowRoot.appendChild(styleRoot)
    shadowRoot.appendChild(renderRoot)

    // TODO: build and bundle css for prod
    styleCache.injectOptions({
      onInsertRule(rule) {
        const sheet = styleRoot.sheet

        if (sheet) {
          sheet.insertRule(rule, sheet.cssRules.length)
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

    applyResetStyles(`#${REPRO_ROOT_ID}`, this.styleRoot)

    ReactDOM.render(
      <RecordingStreamProvider stream={stream}>
        <StateProvider state={this.state}>
          <DevToolsContainer />
        </StateProvider>
      </RecordingStreamProvider>,
      this.renderRoot
    )
  }

  public disconnectedCallback() {
    ReactDOM.unmountComponentAtNode(this.renderRoot)
  }
}

window.customElements.define(NODE_NAME, ReproDevTools)

const devtools = document.createElement(NODE_NAME)
document.body.appendChild(devtools)
