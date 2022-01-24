import { InlineBlock } from 'jsxstyle'
import React from 'react'
import { Share as ShareIcon } from 'react-feather'
import { Button } from '@/components/Button'

interface Props {
  onClick(): void
}

export const ExporterButton: React.FC<Props> = ({ onClick }) => (
  <Button variant="primary" size="small" context="success" onClick={onClick}>
    <ShareIcon size={16} />
    <InlineBlock>Export</InlineBlock>
  </Button>
)
