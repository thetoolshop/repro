import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'

export const Inspector: React.FC = () => (
  <Block
    gridArea="inspector"
    height={240}
    borderTop={`2px solid ${colors.blueGray['200']}`}
  ></Block>
)
