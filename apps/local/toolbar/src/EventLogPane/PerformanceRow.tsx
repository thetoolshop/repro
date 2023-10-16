import { PerformanceEntryType, PerformanceEvent } from '@repro/domain'
import { Block } from 'jsxstyle'
import React from 'react'
import { BaseRow } from './BaseRow'

interface Props {
  event: PerformanceEvent
  index: number
  style: React.CSSProperties
}

export const PerformanceRow: React.FC<Props> = ({ event, index, style }) => {
  return (
    <BaseRow event={event} index={index} style={style}>
      <Block>{PerformanceEntryType[event.data.type]}</Block>
    </BaseRow>
  )
}
