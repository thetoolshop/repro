import { SourceEvent } from '@/types/recording'
import { VTree } from '@/types/vdom'
import { copyObjectDeep } from '@/utils/lang'

interface Frame {
  elapsed: number
  initialSnapshot: VTree | null
  events: Array<SourceEvent>
}

let lastFrame: Frame | null = null

export const Trace = {
  on: false,

  createFrame(frame: Frame) {
    if (Trace.on) {
      lastFrame = copyObjectDeep(frame)
    }
  },

  getLastFrame() {
    return lastFrame
  },
}
