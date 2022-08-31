import { Block } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import { colors } from '~/config/theme'

export const FullWidthViewport: React.FC<PropsWithChildren> = ({
  children,
}) => (
  <Block width="100%" height="100%" background={colors.white}>
    {children}
  </Block>
)
