import { Block, Row } from 'jsxstyle'
import React, { MutableRefObject, useEffect, useRef } from 'react'
import { fromEvent, NEVER, Observable, Subscription } from 'rxjs'
import {
  distinctUntilChanged,
  map,
  mapTo,
  startWith,
  switchMap,
  switchMapTo,
  take,
  takeUntil,
} from 'rxjs/operators'
import { colors } from '@/config/theme'
import { usePlayback } from '../hooks'
import { PlaybackState } from '../types'
import { PlayAction } from './PlayAction'

export const SimpleTimeline: React.FC = () => {
  const ref = useRef() as MutableRefObject<HTMLDivElement>
  const playback = usePlayback()

  useEffect(() => {
    const subscription = new Subscription()
    const root = ref.current

    if (root) {
      const background = createBackgroundElement()
      const ghost = createGhostElement()
      const progress = createProgressElement()
      const tooltip = createTooltipElement()

      root.append(background, ghost, progress, tooltip)

      function mapPointerEventToOffset(evt: PointerEvent) {
        const { x: rootOffsetX, width: rootWidth } =
          root.getBoundingClientRect()
        return Math.max(0, Math.min(1, (evt.clientX - rootOffsetX) / rootWidth))
      }

      function mapOffsetToValue(offset: number) {
        const maxValue = playback.getDuration()
        return Math.max(0, Math.min(maxValue, maxValue * offset))
      }

      function mapValueToOffset(value: number) {
        return value / playback.getDuration()
      }

      // Direct events
      const pointerEnter$ = fromEvent<PointerEvent>(root, 'pointerenter')
      const pointerLeave$ = fromEvent<PointerEvent>(root, 'pointerleave')
      const pointerDown$ = fromEvent<PointerEvent>(root, 'pointerdown')

      // Indirect events
      const pointerMove$ = fromEvent<PointerEvent>(window, 'pointermove')
      const pointerUp$ = fromEvent<PointerEvent>(window, 'pointerup')

      subscription.add(
        pointerDown$
          .pipe(
            switchMapTo(pointerUp$.pipe(take(1))),
            map(mapPointerEventToOffset),
            map(mapOffsetToValue)
          )
          .subscribe(value => {
            playback.seekToTime(value)
          })
      )

      subscription.add(
        pointerEnter$
          .pipe(
            switchMapTo(pointerMove$.pipe(takeUntil(pointerLeave$))),
            map(evt => {
              const offset = mapPointerEventToOffset(evt)
              const value = mapOffsetToValue(offset)
              return [offset, value] as const
            })
          )
          .subscribe(([offset, value]) => {
            const maxValue = playback.getDuration()
            updateBarOffset(ghost, offset)
            updateTooltip(tooltip, offset, `-${Math.round(maxValue - value)}ms`)
            showTooltip(tooltip)
          })
      )

      subscription.add(
        pointerLeave$.subscribe(() => {
          updateBarOffset(ghost, 0)
          hideTooltip(tooltip)
        })
      )

      subscription.add(
        pointerDown$
          .pipe(
            switchMap(() => {
              const playing =
                playback.getPlaybackState() === PlaybackState.Playing
              return pointerUp$.pipe(
                mapTo(playing),
                startWith(false),
                distinctUntilChanged()
              )
            })
          )
          .subscribe(playing => {
            if (playing) {
              playback.play()
            } else {
              playback.pause()
            }
          })
      )

      subscription.add(
        pointerDown$.pipe(map(mapPointerEventToOffset)).subscribe(offset => {
          updateBarOffset(progress, offset)
        })
      )

      subscription.add(
        pointerDown$
          .pipe(
            switchMapTo(pointerMove$.pipe(takeUntil(pointerUp$))),
            map(mapPointerEventToOffset)
          )
          .subscribe(offset => {
            updateBarOffset(progress, offset)
          })
      )

      subscription.add(
        playback.$playbackState
          .pipe(
            switchMap(playbackState =>
              playbackState === PlaybackState.Playing
                ? createAnimationObservable(
                    progress,
                    playback.getElapsed(),
                    playback.getDuration()
                  )
                : NEVER
            )
          )
          .subscribe(animation => animation.play())
      )

      subscription.add(
        playback.$latestControlFrame
          .pipe(
            map(() => playback.getElapsed()),
            map(mapValueToOffset)
          )
          .subscribe(offset => updateBarOffset(progress, offset))
      )
    }

    return () => {
      subscription.unsubscribe()

      if (root) {
        while (root.firstChild) {
          root.firstChild.remove()
        }
      }
    }
  }, [playback, ref])

  return (
    <Row alignItems="center" height="100%" gap={8}>
      <PlayAction />
      <Block
        position="relative"
        width="100%"
        height={8}
        hoverHeight={12}
        transition="height 100ms linear"
        props={{ ref }}
      />
    </Row>
  )
}

function createAnimationObservable(
  target: HTMLElement,
  from: number,
  to: number
) {
  return new Observable<Animation>(observer => {
    const scaleFrom = from / to
    const scaleTo = 1.0

    const keyframes: Array<Keyframe> = [
      { transform: `scaleX(${scaleFrom})` },
      { transform: `scaleX(${scaleTo})` },
    ]

    const options: KeyframeEffectOptions = {
      duration: to - from,
      easing: 'linear',
      fill: 'forwards',
      iterations: 1,
    }

    const effect = new KeyframeEffect(target, keyframes, options)
    const animation = new Animation(effect)

    observer.next(animation)

    return () => {
      const duration = to - from
      const completed = (animation.currentTime ?? 0) / duration
      const finalOffset = (from + duration * completed) / to
      updateBarOffset(target, finalOffset)
      animation.cancel()
    }
  })
}

function createBackgroundElement() {
  const elem = document.createElement('div')

  const styles = [
    ['backgroundColor', colors.slate['200'] as string],
    ['cursor', 'pointer'],
    ['height', '100%'],
    ['pointerEvents', 'none'],
    ['position', 'relative'],
    ['width', '100%'],
  ] as const

  for (const [key, value] of styles) {
    elem.style[key] = value
  }

  return elem
}

function createProgressElement() {
  const elem = document.createElement('div')

  const styles = [
    ['backgroundColor', colors.blue['500'] as string],
    ['height', '100%'],
    ['left', '0'],
    ['pointerEvents', 'none'],
    ['position', 'absolute'],
    ['top', '0'],
    ['transform', 'scaleX(0)'],
    ['transformOrigin', '0 0'],
    ['width', '100%'],
  ] as const

  for (const [key, value] of styles) {
    elem.style[key] = value
  }

  return elem
}

function createGhostElement() {
  const elem = document.createElement('div')

  const styles = [
    ['backgroundColor', colors.slate['300'] as string],
    ['height', '100%'],
    ['left', '0'],
    ['pointerEvents', 'none'],
    ['position', 'absolute'],
    ['transform', 'scaleX(0)'],
    ['transformOrigin', '0 0'],
    ['top', '0'],
    ['width', '100%'],
  ] as const

  for (const [key, value] of styles) {
    elem.style[key] = value
  }

  return elem
}

function createTooltipElement() {
  const elem = document.createElement('div')

  const styles = [
    ['backgroundColor', colors.slate['700'] as string],
    ['color', colors.white],
    ['display', 'none'],
    ['fontSize', '11px'],
    ['left', '0'],
    ['padding', '8px'],
    ['position', 'absolute'],
    ['top', '0'],
    ['transform', 'translate(-50%, -125%)'],
  ] as const

  for (const [key, value] of styles) {
    elem.style[key] = value
  }

  return elem
}

function updateBarOffset(target: HTMLElement, offset: number) {
  target.style.transform = `scaleX(${offset})`
}

function updateTooltip(target: HTMLElement, offset: number, value: string) {
  target.style.left = `${offset * 100}%`
  target.textContent = value
}

function showTooltip(target: HTMLElement) {
  target.style.display = 'block'
}

function hideTooltip(target: HTMLElement) {
  target.style.display = 'none'
}
