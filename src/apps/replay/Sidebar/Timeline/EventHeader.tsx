import { Block, Row } from 'jsxstyle'
import React from 'react'
import { TailwindColorGroup } from 'tailwindcss/tailwind-config'
import { colors } from '@/config/theme'
import { formatDate } from '@/utils/date'
import { Label } from './Label'

interface Props {
  colorGroup: TailwindColorGroup
  time: number
  primaryLabel: string
  secondaryLabel: string
}

export const EventHeader: React.FC<Props> = ({
  colorGroup,
  primaryLabel,
  secondaryLabel,
  time,
}) => (
  <Row alignItems="center" gap="1rem">
    <Block
      color={colors.blueGray['700']}
      fontFamily="monospace"
      fontSize="1.2rem"
    >
      {formatDate(time, 'millis')}
    </Block>
    <Row gap="0.5rem">
      <Label type="primary" colorGroup={colorGroup}>
        {primaryLabel}
      </Label>
      <Label type="secondary" colorGroup={colorGroup}>
        {secondaryLabel}
      </Label>
    </Row>
  </Row>
)
