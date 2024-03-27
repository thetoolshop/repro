import { InteractionEvent, InteractionType } from '@repro/domain'
import { Block } from 'jsxstyle'
import React from 'react'
import { BaseRow } from './BaseRow'

interface Props {
  event: InteractionEvent
  index: number
  style: React.CSSProperties
}

export const InteractionRow: React.FC<Props> = ({ event, index, style }) => {
  return (
    <BaseRow event={event} index={index} style={style}>
      <Block>{InteractionType[event.data.type]}</Block>
    </BaseRow>
  )
}
