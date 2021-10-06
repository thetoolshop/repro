import { SourceEvent } from '@/types/recording'
import { VTree } from '@/types/vdom'
import { copyObjectDeep } from '@/utils/lang'

let enabled = false

interface Frame {
  elapsed: number
  snapshot: VTree | null
  events: Array<SourceEvent>
}

let lastFrame: Frame | null = null

export const Trace = {
  enable() {
    enabled = true
  },

  disable() {
    enabled = false
  },

  createFrame(factory: () => Frame) {
    if (enabled) {
      lastFrame = copyObjectDeep(factory())
    }
  },

  getLastFrame() {
    return lastFrame
  },
}
