import { Meta, Story } from '@ladle/react'
import {
  AttributePatch,
  InteractionType,
  PatchType,
  PointerState,
  SourceEventType,
  SourceEventView,
} from '@repro/domain'
import { LazyList } from '@repro/std'
import { html2VTree } from '@repro/testing-utils'
import { findElementsByClassName } from '@repro/vdom-utils'
import { Grid } from 'jsxstyle'
import React from 'react'
import { PlaybackProvider } from '../context'
import { createSourcePlayback } from '../createSourcePlayback'
import { PlaybackEditor } from './PlaybackEditor'

const meta: Meta = {
  title: 'PlaybackEditor',
}

export default meta

const vtree = html2VTree(`
  <!doctype html>
  <html lang="en">
    <head>
      <style>
        .box { width: 100px; height: 100px; }
        .blue { background-color: blue; }
        .red { background-color: red; }
      </style>
    </head>
    <body>
      <div class="box blue"></div>
    </body>
  </html>
`)

const boxElement = vtree
  ? findElementsByClassName(vtree, 'box')[0] ?? null
  : null

const patch: AttributePatch = {
  type: PatchType.Attribute,
  targetId: boxElement!.id,
  name: 'class',
  oldValue: 'box blue',
  value: 'box red',
}

const events = new LazyList(
  [
    SourceEventView.from({
      type: SourceEventType.Snapshot,
      time: 0,
      data: {
        dom: vtree,
        interaction: {
          pageURL: '',
          pointer: [10, 10],
          pointerState: PointerState.Up,
          scroll: {},
          viewport: [400, 400],
        },
      },
    }),

    SourceEventView.from({
      type: SourceEventType.Interaction,
      time: 400,
      data: {
        type: InteractionType.PointerMove,
        from: [10, 10],
        to: [200, 100],
        duration: 25,
      },
    }),

    SourceEventView.from({
      type: SourceEventType.Interaction,
      time: 750,
      data: {
        type: InteractionType.PointerMove,
        from: [200, 100],
        to: [300, 300],
        duration: 25,
      },
    }),

    SourceEventView.from({
      type: SourceEventType.DOMPatch,
      time: 1000,
      data: patch,
    }),
  ],
  SourceEventView.decode,
  SourceEventView.encode
)

export const Default: Story = () => (
  <PlaybackProvider playback={createSourcePlayback(events, {})}>
    <Grid height={640}>
      <PlaybackEditor />
    </Grid>
  </PlaybackProvider>
)
