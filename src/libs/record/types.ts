export interface RecordingOptions {
  types: Set<'dom' | 'interaction' | 'network' | 'performance' | 'console'>
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

