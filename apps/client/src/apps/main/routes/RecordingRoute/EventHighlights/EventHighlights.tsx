import {
  InteractionType,
  LogLevel,
  SourceEvent,
  SourceEventType,
  SourceEventView,
} from '@repro/domain'
import { Block, Row } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { colors } from '~/config/theme'
import { usePlayback } from '~/libs/playback'
import { formatDate } from '~/utils/date'
import { ConsoleEntry } from './ConsoleEntry'
import { InteractionEntry } from './InteractionEntry'

function shouldIncludeEvent(event: SourceEvent) {
  switch (event.type) {
    case SourceEventType.Interaction:
      return event.data.type === InteractionType.Click

    case SourceEventType.Console:
      return event.data.level === LogLevel.Error
  }

  return false
}

export const EventHighlights: React.FC = () => {
  const playback = usePlayback()
  const [userEvents, setUserEvents] = useState<Array<[number, SourceEvent]>>([])

  useEffect(() => {
    const allSourceEvents = playback.getSourceEvents().toSource()
    const events: Array<[number, SourceEvent]> = []

    for (let i = 0, len = allSourceEvents.length; i < len; i++) {
      const dataView = allSourceEvents[i]

      if (dataView) {
        const event = SourceEventView.over(dataView)

        if (shouldIncludeEvent(event)) {
          events.push([i, event])
        }
      }
    }

    setUserEvents(events)
  }, [playback, setUserEvents])

  if (userEvents.length === 0) {
    return null
  }

  return (
    <AutoSizer disableWidth>
      {({ height }) => (
        <FixedSizeList
          height={height}
          width="100%"
          itemSize={40}
          itemCount={userEvents.length}
          itemData={userEvents}
        >
          {UserEventRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  )
}

const UserEventRow: React.FC<
  ListChildComponentProps<Array<[number, SourceEvent]>>
> = ({ index, style, data: userEvents }) => {
  const indexedEvent = userEvents[index]

  if (!indexedEvent) {
    return null
  }

  const [eventIndex, event] = indexedEvent

  switch (event.type) {
    case SourceEventType.Console:
      return (
        <ConsoleEntry
          rowIndex={index}
          style={style}
          eventIndex={eventIndex}
          event={event}
        />
      )

    case SourceEventType.Interaction:
      return (
        <InteractionEntry
          rowIndex={index}
          style={style}
          eventIndex={eventIndex}
          event={event}
        />
      )
  }

  return (
    <Row
      style={style}
      paddingH={15}
      alignItems="center"
      gap={5}
      fontSize={13}
      backgroundColor={index % 2 === 0 ? colors.slate['100'] : colors.white}
      overflow="hidden"
      cursor="pointer"
    >
      <Block color={colors.slate['500']}>
        {formatDate(event.time, 'seconds')}
      </Block>
    </Row>
  )
}
