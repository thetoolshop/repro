import { Block } from 'jsxstyle'
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { colors } from '@/config/theme'
import {
  fromEvent,
  map,
  share,
  Subscription,
  switchMap,
  switchMapTo,
  take,
  takeUntil,
  tap,
} from 'rxjs'

interface Props {
  value: [number, number]
  minValue: number
  maxValue: number
  onChange(value: [number, number]): void
  disabled?: boolean
}

export const RangeSelector: React.FC<Props> = ({
  minValue,
  maxValue,
  value,
  onChange,
}) => {
  // Track pending value in a ref to keep `handleChange` referentially
  // equal and not invalidate effect on handle during update
  const pendingValue = useRef(value)
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    pendingValue.current = value
    setInternalValue(value)
  }, [value, pendingValue, setInternalValue])

  const [left, right] = internalValue

  // Normalized values [0..1]
  const offsetLeft = maxValue > 0 ? (left - minValue) / maxValue : 0
  const offsetRight = maxValue > 0 ? (right - minValue) / maxValue : 0

  const handleLeftUpdate = useCallback(
    (offset: number) => {
      const convertedValue = (maxValue - minValue) * offset
      const nextValue: [number, number] = [
        Math.max(minValue, Math.min(convertedValue, right)),
        right,
      ]

      pendingValue.current = nextValue
      setInternalValue(nextValue)
    },
    [pendingValue, right, minValue, maxValue, setInternalValue]
  )

  const handleRightUpdate = useCallback(
    (offset: number) => {
      const convertedValue = (maxValue - minValue) * offset
      const nextValue: [number, number] = [
        left,
        Math.min(maxValue, Math.max(convertedValue, left)),
      ]

      pendingValue.current = nextValue
      setInternalValue(nextValue)
    },
    [pendingValue, left, minValue, maxValue, setInternalValue]
  )

  const handleChange = useCallback(() => {
    onChange(pendingValue.current)
  }, [pendingValue, onChange])

  return (
    <Container>
      <Selection left={offsetLeft} right={offsetRight} />
      <Handle
        offset={offsetLeft}
        minOffset={0}
        maxOffset={offsetRight}
        onUpdate={handleLeftUpdate}
        onDone={handleChange}
      />
      <Handle
        offset={offsetRight}
        minOffset={offsetLeft}
        maxOffset={1}
        onUpdate={handleRightUpdate}
        onDone={handleChange}
      />
    </Container>
  )
}

const Container: React.FC = ({ children }) => (
  <Block
    position="relative"
    height={8}
    marginH={8}
    backgroundColor={colors.slate['100']}
  >
    {children}
  </Block>
)

interface SelectionProps {
  left: number
  right: number
}

const Selection: React.FC<SelectionProps> = ({ left, right }) => (
  <Block
    position="absolute"
    height="100%"
    top={0}
    background={colors.slate['300']}
    style={{
      left: `${left * 100}%`,
      width: `${(right - left) * 100}%`,
    }}
  />
)

interface HandleProps {
  offset: number
  minOffset: number
  maxOffset: number
  onUpdate(value: number): void
  onDone(value: number): void
}

const Handle: React.FC<HandleProps> = ({
  offset,
  minOffset,
  maxOffset,
  onUpdate,
  onDone,
}) => {
  const ref = useRef() as MutableRefObject<HTMLDivElement>

  useEffect(() => {
    const subscription = new Subscription()
    const elem = ref.current
    const container = elem.parentElement

    function mapPointerEventToOffset(evt: PointerEvent): number {
      if (container) {
        const { width, x } = container.getBoundingClientRect()
        return Math.max(minOffset, Math.min(maxOffset, (evt.pageX - x) / width))
      }

      return minOffset
    }

    const pointerDown$ = fromEvent<PointerEvent>(elem, 'pointerdown').pipe(
      tap(evt => evt.preventDefault()),
      map(mapPointerEventToOffset),
      share()
    )

    const pointerMove$ = fromEvent<PointerEvent>(window, 'pointermove').pipe(
      tap(evt => evt.preventDefault()),
      map(mapPointerEventToOffset),
      share()
    )

    const pointerUp$ = fromEvent<PointerEvent>(window, 'pointerup').pipe(
      tap(evt => evt.preventDefault()),
      map(mapPointerEventToOffset),
      share()
    )

    subscription.add(pointerDown$.subscribe(onUpdate))

    subscription.add(
      pointerDown$
        .pipe(switchMap(() => pointerMove$.pipe(takeUntil(pointerUp$))))
        .subscribe(onUpdate)
    )

    subscription.add(
      pointerDown$
        .pipe(switchMapTo(pointerUp$.pipe(take(1))))
        .subscribe(offset => {
          onUpdate(offset)
          onDone(offset)
        })
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [ref, minOffset, maxOffset, onUpdate, onDone])

  return (
    <Block
      position="absolute"
      top={0}
      transform="translate(-50%, -25%)"
      width={16}
      height={16}
      background={colors.slate['300']}
      borderRadius={16}
      cursor="col-resize"
      props={{ ref }}
      style={{
        left: `${offset * 100}%`,
      }}
    />
  )
}
