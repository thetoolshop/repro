import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'

export const Sidebar: React.FC = () => (
  <Block
    gridArea="sidebar"
    width={300}
    borderRight={`2px solid ${colors.blueGray['200']}`}
  ></Block>
)
