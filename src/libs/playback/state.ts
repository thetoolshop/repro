import { RecordingController } from '@/libs/record'
import { SyntheticId } from '@/types/common'
import { Point, ScrollMap } from '@/types/interaction'
import { Recording, Source, SourceEvent } from '@/types/recording'
import { VTree } from '@/types/vdom'
import { createAtom } from '@/utils/state'
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

export enum PointerState {
  Up,
  Down,
}

export const [$activeIndex, getActiveIndex, setActiveIndex] = createAtom(-1)
export const [$buffer, getBuffer, setBuffer] = createAtom<SourceEvent[]>([])
export const [$elapsed, getElapsed, setElapsed] = createAtom(0)
export const [$focusedNode, getFocusedNode, setFocusedNode] = createAtom<SyntheticId | null>(null)
export const [$playbackState, getPlaybackState, setPlaybackState] = createAtom(PlaybackState.Paused)
export const [$pointer, getPointer, setPointer] = createAtom<Point>([0, 0])
export const [$pointerState, getPointerState, setPointerState] = createAtom(PointerState.Up)
export const [$readyState, getReadyState, setReadyState] = createAtom(ReadyState.Loading)
export const [$recording, getRecording, setRecording] = createAtom<Recording>(RecordingController.EMPTY)
export const [$scrollStates, getScrollStates, setScrollStates] = createAtom<ScrollMap>({})
export const [$snapshot, getSnapshot, setSnapshot] = createAtom<VTree | null>(null)
export const [$source, getSource, setSource] = createAtom<Source>(new NullSource())
export const [$viewport, getViewport, setViewport] = createAtom<Point>([0, 0])
