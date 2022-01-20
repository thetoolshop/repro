import { Grid } from 'jsxstyle'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { fromEvent, Subscription } from 'rxjs'
import { map, share, switchMapTo, take, takeUntil, tap } from 'rxjs/operators'
import { SCALING_FACTOR } from './constants'
import { Cursor } from './Cursor'
import { Meter } from './Meter'
import { PlayAction } from './PlayAction'

interface Props {
  initialValue: number
  maxValue: number
  playing: boolean
  onPause(): void
  onPlay(): void
  onSeek(offset: number): void
  onSeekStart(): void
  onSeekEnd(): void
}

export const TimelineControl: React.FC<Props> = ({
  onPause,
  onPlay,
  onSeek,
  onSeekStart,
  onSeekEnd,
  initialValue,
  maxValue,
  playing,
}) => {
  const meterRef = useRef() as MutableRefObject<HTMLDivElement>
  const [ghost, setGhost] = useState<number | null>(null)
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    if (meterRef.current) {
      const { width } = meterRef.current.getBoundingClientRect()
      setCursor(Math.min(width, (maxValue - initialValue) / SCALING_FACTOR))
    }
  }, [meterRef, initialValue, maxValue, setCursor])

  useEffect(() => {
    const subscription = new Subscription()
    const elem = meterRef.current

    if (elem) {
      function mapPointerEventToOffset(evt: PointerEvent): [number, number] {
        const { x, width } = elem.getBoundingClientRect()
        return [width, Math.max(0, x + width - evt.pageX)]
      }

      const pointerEnter$ = fromEvent<PointerEvent>(elem, 'pointerenter').pipe(
        share()
      )

      const pointerLeave$ = fromEvent<PointerEvent>(elem, 'pointerleave').pipe(
        share()
      )

      const pointerDown$ = fromEvent<PointerEvent>(elem, 'pointerdown').pipe(
        tap(evt => evt.preventDefault()),
        map(mapPointerEventToOffset),
        share()
      )

      const pointerUp$ = fromEvent<PointerEvent>(window, 'pointerup').pipe(
        tap(evt => evt.preventDefault()),
        map(mapPointerEventToOffset),
        share()
      )

      const pointerMove$ = fromEvent<PointerEvent>(window, 'pointermove').pipe(
        tap(evt => evt.preventDefault()),
        map(mapPointerEventToOffset),
        share()
      )

      subscription.add(pointerLeave$.subscribe(() => setGhost(null)))

      subscription.add(
        pointerEnter$
          .pipe(switchMapTo(pointerMove$.pipe(takeUntil(pointerLeave$))))
          .subscribe(([maxN, n]) => setGhost(Math.min(maxN, n)))
      )

      subscription.add(
        pointerDown$.subscribe(([maxN, n]) => {
          setCursor(Math.min(maxN, n))
          onSeekStart()
        })
      )

      subscription.add(
        pointerDown$
          .pipe(switchMapTo(pointerUp$.pipe(take(1))))
          .subscribe(([maxN, n]) => {
            onSeek(Math.min(maxN, n) * SCALING_FACTOR)
            onSeekEnd()
          })
      )

      subscription.add(
        pointerDown$
          .pipe(switchMapTo(pointerMove$.pipe(takeUntil(pointerUp$))))
          .subscribe(([maxN, n]) => setCursor(Math.min(maxN, n)))
      )
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [meterRef, setGhost, setCursor, onSeek, onSeekStart, onSeekEnd])

  return (
    <Container>
      <PlayAction onPlay={onPlay} onPause={onPause} playing={playing} />
      <Meter ref={meterRef} maxValue={maxValue} />
      {ghost !== null && (
        <Cursor offset={ghost} type="ghost" animateToZero={false} />
      )}
      <Cursor offset={cursor} type="cursor" animateToZero={playing} />
    </Container>
  )
}

type ContainerProps = React.HTMLProps<HTMLDivElement>

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ children }, ref) => (
    <Grid
      gridTemplateColumns="auto 1fr"
      gridColumnGap={8}
      alignItems="center"
      position="relative"
      height="100%"
      userSelect="none"
      props={{ ref }}
    >
      {children}
    </Grid>
  )
)
