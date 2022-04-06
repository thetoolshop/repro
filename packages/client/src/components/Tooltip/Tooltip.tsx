import { Block } from 'jsxstyle'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { colors } from '@/config/theme'
import { fromEvent, Subscription } from 'rxjs'

interface Props {
  position?: 'top' | 'bottom'
}

const MAX_INT32 = 2 ** 32 - 1

export const Tooltip: React.FC<Props> = ({ children, position = 'top' }) => {
  const ref = useRef() as MutableRefObject<HTMLDivElement>
  const [active, setActive] = useState(false)

  useEffect(() => {
    const subscription = new Subscription()
    const parent = ref.current ? ref.current.parentElement : null

    if (parent) {
      subscription.add(
        fromEvent(parent, 'pointerenter').subscribe(() => setActive(true))
      )

      subscription.add(
        fromEvent(parent, 'pointerleave').subscribe(() => setActive(false))
      )
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [ref, setActive])

  return (
    <Block
      padding={8}
      position="absolute"
      bottom={position === 'bottom' ? 0 : 'auto'}
      top={position === 'top' ? 0 : 'auto'}
      left="50%"
      transform={`translate(-50%, ${position === 'top' ? '-75%' : '75%'})`}
      backgroundColor={colors.slate['700']}
      color={colors.white}
      fontSize={11}
      whiteSpace="nowrap"
      pointerEvents="none"
      opacity={active ? 1 : 0}
      transition="opacity linear 100ms"
      zIndex={MAX_INT32}
      props={{ ref }}
    >
      {children}
    </Block>
  )
}
