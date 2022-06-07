import { Block } from 'jsxstyle'
import { JsxstyleProps } from 'jsxstyle/lib/types'
import React, { PropsWithChildren } from 'react'

type Props = PropsWithChildren<JsxstyleProps<'div'>>

export const Spin: React.FC<Props> = ({ children, ...props }) => (
  <Block
    {...props}
    animationIterationCount="infinite"
    animationDuration="1s"
    animation={{
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    }}
  >
    {children}
  </Block>
)
