import { Stats, Trace } from '@/libs/diagnostics'
import { RecordingController } from '@/libs/record'
import { REPRO_ROOT_ID } from './constants'
import { Command, RecordingResponse } from './types'

Stats.enable()
Trace.enable()

const controller = new RecordingController(document, {
  types: new Set(['dom', 'interaction']),
  ignoredNodes: document.currentScript ? [document.currentScript] : undefined,
  ignoredSelectors: [`#${REPRO_ROOT_ID}`, '.repro-ignore'],
})

window.addEventListener(
  'message',
  message => {
    const port = message.ports[0]

    if (!port) {
      return
    }

    port.addEventListener('message', (ev: MessageEvent<Command>) => {
      const command = ev.data

      switch (command.name) {
        case 'start':
          controller.start()
          break

        case 'stop':
          controller.stop()
          port.postMessage({
            name: 'recording',
            payload: controller.recording,
          } as RecordingResponse)
          break
      }
    })

    port.start()
  },
  { once: true }
)
