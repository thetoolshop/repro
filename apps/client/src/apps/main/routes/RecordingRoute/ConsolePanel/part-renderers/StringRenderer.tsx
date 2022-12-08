import { InlineBlock } from 'jsxstyle'
import React from 'react'

interface Props {
  value: string
}

export const StringRenderer: React.FC<Props> = ({ value }) => (
  <InlineBlock whiteSpace="pre">{value}</InlineBlock>
)
