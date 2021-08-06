import { Source, SourceEvent } from '@/types/source'
import { VTree } from '@/types/vdom'
import { atom } from '@/utils/state'
import { NullSource } from './NullSource'

export enum PlaybackState {
  Loading,
  Paused,
  Playing,
  Done,
}

export const $source = atom<Source>(new NullSource())
export const $events = atom<SourceEvent[]>([])
export const $buffer = atom<SourceEvent[]>([])
export const $cursor = atom<number>(-1)
export const $snapshot = atom<VTree | null>(null)
export const $playbackState = atom(PlaybackState.Loading)
export const $elapsed = atom(0)
export const $duration = atom(0)
