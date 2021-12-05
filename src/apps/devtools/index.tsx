import { Stats, Trace } from '@/libs/diagnostics'
import { createRecordingStream, RecordingStreamProvider } from '@/libs/record'
import { cache as styleCache } from 'jsxstyle'
import React from 'react'
import ReactDOM from 'react-dom'
import { StateProvider } from './context'
import { createState } from './createState'
import { DevTools } from './DevTools'

Stats.enable()
Trace.enable()

class ReproDevTools extends HTMLElement {
  private renderRoot: HTMLDivElement
  private state = createState()

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'closed' })
    const renderRoot = (this.renderRoot = document.createElement('div'))
    const styleRoot = document.createElement('style')

    shadowRoot.appendChild(styleRoot)
    shadowRoot.appendChild(renderRoot)

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
    const ignoredSelectors = ['.repro-ignore']
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

    ReactDOM.render(
      <RecordingStreamProvider stream={stream}>
        <StateProvider state={this.state}>
          <DevTools />
        </StateProvider>
      </RecordingStreamProvider>,
      this.renderRoot
    )
  }

  public disconnectedCallback() {
    ReactDOM.unmountComponentAtNode(this.renderRoot)
  }
}

window.customElements.define('repro-devtools', ReproDevTools)

const devtools = document.createElement('repro-devtools')
document.body.appendChild(devtools)
