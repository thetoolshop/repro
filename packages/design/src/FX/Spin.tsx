import { InlineBlock } from 'jsxstyle'
// @ts-expect-error Cannot find type declaration from npm-forks
import { JsxstyleProps } from 'jsxstyle/lib/types'
import React, { PropsWithChildren } from 'react'

type Props = PropsWithChildren<JsxstyleProps<'div'>>

const animation = {
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
}

export const Spin: React.FC<Props> = React.memo(({ children, ...props }) => (
  <InlineBlock
    {...props}
    lineHeight={0}
    animationIterationCount="infinite"
    animationDuration="1s"
    animation={animation}
  >
    {children}
  </InlineBlock>
))
