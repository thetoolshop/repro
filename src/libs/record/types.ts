import { Immutable } from '@/types/extensions'
import { VTree } from '@/types/vdom'

export interface Visitor<T> {
  documentNode(node: Document): void
  documentFragmentNode(node: DocumentFragment): void
  documentTypeNode(node: DocumentType): void
  elementNode(node: Element): void
  textNode(node: Text): void
  done(): T | null
}

export type Subscriber<T> = (value: T) => void

export interface Subscribable<T> {
  subscribe(subscriber: Subscriber<T>): void
}

export interface DOMOptions {
  ignoredNodes: Array<Node>
  ignoredSelectors: Array<string>
}

export interface RecordingOptions extends DOMOptions {
  types: Set<'dom' | 'interaction' | 'network' | 'performance' | 'console'>
  snapshotInterval: number
  eventSampling: {
    pointerMove: number
    resize: number
    scroll: number
  }
}

export interface ObserverLike<T extends any = any> {
  disconnect(): void
  observe(target: T, vtree: Immutable<VTree>): void
}

