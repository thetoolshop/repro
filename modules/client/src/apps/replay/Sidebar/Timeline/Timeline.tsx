import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import { seekToEvent, useActiveIndex, useRecording } from '@/libs/playback'
import { EventView } from './EventView'
import { SourceEventType } from '@/types/recording'

export const Timeline: React.FC = () => {
  const activeIndex = useActiveIndex()
  const recording = useRecording()

  return (
    <Block>
      {recording.events.map((event, i) => {
        if (event.type !== SourceEventType.DOMPatch) {
          return null
        }

        return (
          <React.Fragment key={i}>
            {i > 0 && <Separator />}
            <EventView
              event={event}
              active={activeIndex === i}
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
