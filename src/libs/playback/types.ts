import { Snapshot, SourceEvent } from '@/types/recording'
import { Atom } from '@/utils/state'

export enum PlaybackState {
  Playing,
  Paused,
  Done,
}

export enum ControlFrame {
  Idle,
  SeekToEvent,
  SeekToTime,
}

export interface Playback {
  // Atoms
  readonly $activeIndex: Atom<number>
  readonly $buffer: Atom<Array<SourceEvent>>
  readonly $elapsed: Atom<number>
  readonly $latestControlFrame: Atom<ControlFrame>
  readonly $playbackState: Atom<PlaybackState>
  readonly $snapshot: Atom<Snapshot>

  // Accessors
  getActiveIndex(): number
  getBuffer(): Array<SourceEvent>
  getDuration(): number
  getElapsed(): number
  getLatestControlFrame(): ControlFrame
  getPlaybackState(): PlaybackState
  getSnapshot(): Snapshot

  // Controls
  play(): void
  pause(): void
  seekToEvent(index: number): void
  seekToTime(time: number): void

  // Lifecycle
  open(): void
  close(): void
}
