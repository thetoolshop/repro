import { DOMPatchEvent, PatchType } from '@repro/domain'
import { Block } from 'jsxstyle'
import React from 'react'
import { BaseRow } from './BaseRow'

interface Props {
  event: DOMPatchEvent
  index: number
  style: React.CSSProperties
}

export const DOMPatchRow: React.FC<Props> = ({ event, index, style }) => {
  return (
    <BaseRow event={event} index={index} style={style}>
      <Block>{PatchType[event.data.type]}</Block>
    </BaseRow>
  )
}
