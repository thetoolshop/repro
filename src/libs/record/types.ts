import { RecordingType } from '@/types/recording'

export interface RecordingOptions {
  types: Set<RecordingType>
  ignoredNodes: Array<Node>
  ignoredSelectors: Array<string>
  eventSampling: {
    pointerMove: number
    resize: number
    scroll: number
  }
}

export interface ObserverLike {
  disconnect(): void
}

