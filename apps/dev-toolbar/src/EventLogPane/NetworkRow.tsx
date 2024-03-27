import { NetworkEvent, NetworkMessageType } from '@repro/domain'
import { Block } from 'jsxstyle'
import React from 'react'
import { BaseRow } from './BaseRow'

interface Props {
  event: NetworkEvent
  index: number
  style: React.CSSProperties
}

export const NetworkRow: React.FC<Props> = ({ event, index, style }) => {
  return (
    <BaseRow event={event} index={index} style={style}>
      <Block>{NetworkMessageType[event.data.type]}</Block>
    </BaseRow>
  )
}
