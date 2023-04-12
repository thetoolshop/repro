import { Block } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import { colors } from '@repro/design'

export const FullWidthViewport: React.FC<PropsWithChildren> = ({
  children,
}) => (
  <Block
    position="relative"
    width="100%"
    height="100%"
    background={colors.white}
  >
    {children}
  </Block>
)
