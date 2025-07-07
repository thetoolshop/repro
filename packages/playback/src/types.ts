import { Atom } from '@repro/atom'
import {
  NodeId,
  Snapshot,
  SourceEventType,
  SourceEventView,
} from '@repro/domain'
import { List } from '@repro/tdl'

export enum PlaybackState {
  Playing,
  Paused,
}

export enum ControlFrame {
  Idle,
  SeekToEvent,
  SeekToTime,
  Flush,
}

export enum BreakpointType {
  VNode,
}

export interface VNodeBreakpoint {
  type: BreakpointType.VNode
  nodeId: NodeId
}

export type Breakpoint = VNodeBreakpoint

export interface Playback {
  // Atoms
  readonly $activeIndex: Atom<number>
  readonly $buffer: Atom<List<SourceEventView>>
  readonly $elapsed: Atom<number>
  readonly $latestControlFrame: Atom<ControlFrame>
  readonly $latestEventTime: Atom<number>
  readonly $playbackState: Atom<PlaybackState>
  readonly $snapshot: Atom<Snapshot>
  readonly $breakpoints: Atom<Array<Breakpoint>>

  // Accessors
  getActiveIndex(): number
  getBuffer(): List<SourceEventView>
  getDuration(): number
  getElapsed(): number
  getEventIndexAtTime(time: number): number | null
  getEventTimeAtIndex(index: number): number | null
  getEventTypeAtIndex(index: number): SourceEventType | null
  getLatestControlFrame(): ControlFrame
  getLatestEventTime(): number
  getPlaybackState(): PlaybackState
  getResourceMap(): Record<string, string>
  getSnapshot(): Snapshot
  getSourceEvents(): List<SourceEventView>
  getBreakpoints(): Array<Breakpoint>

  // Breakpoints
  addBreakpoint(breakpoint: Breakpoint): void
  removeBreakpoint(breakpoint: Breakpoint): void
  clearBreakpoints(): void
  breakNext(): void
  breakPrevious(): void

  // Controls
  play(): void
  pause(): void
  seekToEvent(index: number): void
  seekToTime(time: number): void

  // Lifecycle
  open(): void
  close(): void

  // Operations
  copy(): Playback
}

export type ReadyState = 'waiting' | 'ready' | 'failed'

export interface Source {
  $events: Atom<List<SourceEventView>>
  $duration: Atom<number>
  $readyState: Atom<ReadyState>
  $error: Atom<Error | null>
  $resourceMap: Atom<Record<string, string>>
}
