import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'

export const Menu: React.FC = () => (
  <Block
    gridArea="menu"
    borderRight={`1px solid ${colors.blueGray['200']}`}
  ></Block>
)
