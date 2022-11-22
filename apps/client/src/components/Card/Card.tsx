import { Block } from 'jsxstyle'
import React, { CSSProperties, PropsWithChildren } from 'react'
import { colors } from '~/config/theme'

interface Props {
  fullBleed?: boolean
  height?: CSSProperties['height']
}

export const Card: React.FC<PropsWithChildren<Props>> = ({
  children,
  fullBleed,
  height = 'auto',
}) => (
  <Block
    height={height}
    padding={fullBleed ? 0 : 20}
    backgroundColor={fullBleed ? 'transparent' : colors.white}
    borderRadius={4}
    boxShadow={`
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.1)
    `}
  >
    {children}
  </Block>
)
