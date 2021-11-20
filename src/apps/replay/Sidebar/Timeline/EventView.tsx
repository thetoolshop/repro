import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import { SourceEvent, SourceEventType } from '@/types/recording'
import { DOMPatchEventView } from './DOMPatchEventView'

interface Props {
  event: SourceEvent
  active: boolean
  onSelect(): void
}

export const EventView: React.FC<Props> = ({ event, active, onSelect }) => {
  let view: React.ReactNode = null

  switch (event.type) {
    case SourceEventType.DOMPatch:
      view = <DOMPatchEventView event={event} />
  }

  if (view === null) {
    return null
  }

  const activeColor = colors.blue['50']
  const hoverColor = colors.blueGray['50']

  return (
    <Block
      backgroundColor={active ? activeColor : 'transparent'}
      hoverBackgroundColor={active ? activeColor : hoverColor}
      props={{ onPointerDown: onSelect }}
    >
      {view}
    </Block>
  )
}
