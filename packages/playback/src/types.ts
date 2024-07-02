import { Atom } from '@repro/atom'
import { Snapshot, SourceEvent, SourceEventType } from '@repro/domain'
import { LazyList } from '@repro/std'

export enum PlaybackState {
  Playing,
  Paused,
}

export enum ControlFrame {
  Idle,
  SeekToEvent,
  SeekToTime,
}

export interface Playback {
  // Atoms
  readonly $activeIndex: Atom<number>
  readonly $buffer: Atom<LazyList<SourceEvent>>
  readonly $elapsed: Atom<number>
  readonly $latestControlFrame: Atom<ControlFrame>
  readonly $playbackState: Atom<PlaybackState>
  readonly $snapshot: Atom<Snapshot>

  // Accessors
  getActiveIndex(): number
  getBuffer(): LazyList<SourceEvent>
  getDuration(): number
  getElapsed(): number
  getEventIndexAtTime(time: number): number | null
  getEventTimeAtIndex(index: number): number | null
  getEventTypeAtIndex(index: number): SourceEventType | null
  getLatestControlFrame(): ControlFrame
  getPlaybackState(): PlaybackState
  getResourceMap(): Record<string, string>
  getSnapshot(): Snapshot
  getSourceEvents(): LazyList<SourceEvent>

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
  $events: Atom<LazyList<SourceEvent>>
  $readyState: Atom<ReadyState>
  $resourceMap: Atom<Record<string, string>>
}
