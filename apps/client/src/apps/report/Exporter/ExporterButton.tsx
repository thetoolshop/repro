import { InlineBlock } from 'jsxstyle'
import React from 'react'
import { Share as ShareIcon } from 'lucide-react'
import { Button } from '~/components/Button'

interface Props {
  disabled?: boolean
  onClick(): void
}

export const ExporterButton: React.FC<Props> = ({ onClick }) => (
  <Button variant="contained" size="small" context="success" onClick={onClick}>
    <ShareIcon size={16} />
    <InlineBlock>Save</InlineBlock>
  </Button>
)
