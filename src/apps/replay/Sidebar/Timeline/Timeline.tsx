import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import { seekToEvent, useCursor, useEvents } from '@/libs/playback'
import { EventView } from './EventView'
import { SourceEventType } from '@/types/source'

export const Timeline: React.FC = () => {
  const cursor = useCursor()
  const events = useEvents()

  return (
    <Block>
      {events.map((event, i) => {
        if (event.type !== SourceEventType.DOMPatch) {
          return null
        }

        return (
          <React.Fragment key={i}>
            {i > 0 && <Separator />}
            <EventView
              event={event}
              active={cursor === i}
              onSelect={() => seekToEvent(i)}
            />
          </React.Fragment>
        )
      })}
    </Block>
  )
}

const Separator: React.FC = () => (
  <Block
    backgroundColor={colors.blueGray['100']}
    height={1}
  />
)
