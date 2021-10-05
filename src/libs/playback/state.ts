import { RecordingController } from '@/libs/record'
import { SyntheticId } from '@/types/common'
import { Point } from '@/types/interaction'
import { Recording, Source, SourceEvent } from '@/types/recording'
import { VTree } from '@/types/vdom'
import { atom } from '@/utils/state'
import { NullSource } from './NullSource'

export enum ReadyState {
  Loading,
  Ready,
}

export enum PlaybackState {
  Paused,
  Playing,
  Done,
}

export const $activeIndex = atom<number>(-1)
export const $buffer = atom<SourceEvent[]>([])
export const $elapsed = atom(0)
export const $focusedNode = atom<SyntheticId | null>(null)
export const $playbackState = atom(PlaybackState.Paused)
export const $pointer = atom<Point>([0, 0])
export const $readyState = atom(ReadyState.Loading)
export const $recording = atom<Recording>(RecordingController.EMPTY)
export const $snapshot = atom<VTree | null>(null)
export const $source = atom<Source>(new NullSource())
export const $viewport = atom<Point>([0, 0])
