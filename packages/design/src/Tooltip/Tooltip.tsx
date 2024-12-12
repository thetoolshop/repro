import { Block } from 'jsxstyle'
import React, {
  MutableRefObject,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Subscription, fromEvent } from 'rxjs'
import { Portal } from '../Portal'
import { colors } from '../theme'

type Props = PropsWithChildren<{
  position?: 'top' | 'bottom'
}>

const MAX_INT32 = 2 ** 32 - 1

export const Tooltip: React.FC<Props> = ({ children, position = 'top' }) => {
  const ref = useRef() as MutableRefObject<HTMLDivElement>
  const [active, setActive] = useState(false)
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)

  const updatePosition = useCallback(() => {
    const parent = ref.current ? ref.current.parentElement : null

    if (parent) {
      const { top, left, width, height } = parent.getBoundingClientRect()

      setX(left + width / 2)
      setY(top + (position === 'bottom' ? height : 0))
    }
  }, [ref, setX, setY])

  useEffect(() => {
    const subscription = new Subscription()
    const parent = ref.current ? ref.current.parentElement : null

    if (parent) {
      subscription.add(
        fromEvent(parent, 'pointerenter').subscribe(() => {
          updatePosition()
          setActive(true)
        })
      )

      subscription.add(
        fromEvent(parent, 'pointerleave').subscribe(() => setActive(false))
      )
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [ref, setActive, updatePosition])

  return (
    <Block position="absolute" props={{ ref }}>
      {active && (
        <Portal>
          <Block
            padding={8}
            position="absolute"
            top={y}
            left={x}
            transform={`translate(-50%, -125%)`}
            backgroundColor={colors.slate['700']}
            borderRadius={2}
            color={colors.white}
            fontSize={11}
            whiteSpace="nowrap"
            pointerEvents="none"
            transition="opacity linear 100ms"
            userSelect="none"
            zIndex={MAX_INT32}
          >
            {children}
          </Block>
        </Portal>
      )}
    </Block>
  )
}
