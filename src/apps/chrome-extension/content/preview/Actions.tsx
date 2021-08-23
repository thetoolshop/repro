import { Inline, Row } from 'jsxstyle'
import React from 'react'
import { Check as CheckIcon, X as XIcon } from 'react-feather'
import { Button } from '@/components/Button'
import { colors } from '@/config/theme'

interface Props {
  onCancel: () => void
  onDone: () => void
}

export const Actions: React.FC<Props> = ({ onCancel, onDone }) => (
  <Row
    alignItems="center"
    borderTop={`1px solid ${colors.blueGray['300']}`}
    gap={10}
    justifyContent="flex-end"
    paddingH={10}
  >
    <Button variant="secondary" size="small" onClick={onCancel}>
      <XIcon size={16} />
      <Inline>Cancel</Inline>
    </Button>

    <Button size="small" onClick={onDone}>
      <CheckIcon size={16} />
      <Inline>Done</Inline>
    </Button>
  </Row>
)
