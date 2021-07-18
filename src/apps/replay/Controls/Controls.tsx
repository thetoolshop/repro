import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'

export const Controls: React.FC = () => (
  <Block
    borderTop={`2px solid ${colors.blueGray['200']}`}
    boxShadow={`0 -4px 16px ${colors.blueGray['900']}0D`}
    gridArea="controls"
  ></Block>
)
