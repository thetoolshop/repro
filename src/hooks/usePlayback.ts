import { bind } from '@react-rxjs/core'
import { createSignal } from '@react-rxjs/utils'
import { animationFrames, combineLatest, of } from 'rxjs'
import { map, pairwise, scan, shareReplay, switchMap } from 'rxjs/operators'

export enum PlaybackState {
  Loading,
  Playing,
  Paused,
}

const [state$, setState] = createSignal<PlaybackState>()
const [timeBasis$, setTimeBasis] = createSignal<number>()
const [duration$, setDuration] = createSignal<number>()

const frame$ = state$.pipe(
  shareReplay(1),
  switchMap(state => {
    if (state !== PlaybackState.Playing) {
      return of(0)
    }

    return animationFrames().pipe(
      pairwise(),
      map(([prev, next]) => next.timestamp - prev.timestamp),
    )
  })
)

const elapsed$ = combineLatest([timeBasis$, duration$]).pipe(
  shareReplay(1),
  switchMap(([timeBasis, duration]) =>
    frame$.pipe(
      scan((total, delta) => total + delta, 0),
      map(elapsed => Math.min(duration, timeBasis + elapsed))
    )
  )
)

export function play() {
  setState(PlaybackState.Playing)
}

export function pause() {
  setState(PlaybackState.Paused)
}

export function seek(time: number) {
  setTimeBasis(time)
}

export function initializePlayback(duration: number) {
  setDuration(duration)
  setTimeBasis(0)
  setState(PlaybackState.Paused)
}

export const [useElapsed] = bind(elapsed$, 0)
export const [useDuration] = bind(duration$, 0)
export const [usePlaybackState] = bind(state$, PlaybackState.Loading)
