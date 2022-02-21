import { InlineBlock } from 'jsxstyle'
import React from 'react'
import { Share as ShareIcon } from 'react-feather'
import { Button } from '@/components/Button'

interface Props {
  disabled?: boolean
  onClick(): void
}

export const ExporterButton: React.FC<Props> = ({ disabled, onClick }) => (
  <Button
    variant="primary"
    size="small"
    context="success"
    onClick={onClick}
    disabled={disabled}
  >
    <ShareIcon size={16} />
    <InlineBlock>Save</InlineBlock>
  </Button>
)
