import { Atom } from '@repro/atom'
import { Snapshot, SourceEventType, SourceEventView } from '@repro/domain'
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

export interface Playback {
  // Atoms
  readonly $activeIndex: Atom<number>
  readonly $buffer: Atom<List<SourceEventView>>
  readonly $elapsed: Atom<number>
  readonly $latestControlFrame: Atom<ControlFrame>
  readonly $latestEventTime: Atom<number>
  readonly $playbackState: Atom<PlaybackState>
  readonly $snapshot: Atom<Snapshot>

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
