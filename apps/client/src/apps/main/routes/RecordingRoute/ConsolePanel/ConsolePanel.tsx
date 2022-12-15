import {
  ConsoleEvent,
  MessagePartType,
  SourceEvent,
  SourceEventType,
  SourceEventView,
} from '@repro/domain'
import { Block, Grid } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { colors } from '~/config/theme'
import { Stats } from '~/libs/diagnostics'
import { usePlayback } from '~/libs/playback'
import { useConsoleLevelFilter, useConsoleSearch } from '../hooks'
import { ConsoleRow } from './ConsoleRow'
import { LevelFilter } from './LevelFilter'
import { SearchForm } from './SearchForm'
import { enumToBitField } from './util'

function isConsoleEvent(event: SourceEvent): event is ConsoleEvent {
  return event.type === SourceEventType.Console
}

export const ConsolePanel: React.FC = () => {
  const playback = usePlayback()
  const [consoleSearch, setConsoleSearch] = useConsoleSearch()
  const [consoleLevelFilter, setConsoleLevelFilter] = useConsoleLevelFilter()
  const [consoleEvents, setConsoleEvents] = useState<Array<ConsoleEvent>>([])
  const [filteredConsoleEvents, setFilteredConsoleEvents] = useState<
    Array<ConsoleEvent>
  >([])

  useEffect(() => {
    const events: Array<ConsoleEvent> = []

    Stats.time(
      'ConsolePanel -> get console messages from source events',
      () => {
        const sourceEvents = playback.getSourceEvents().toSource()

        for (const view of sourceEvents) {
          const event = SourceEventView.over(view)

          if (isConsoleEvent(event)) {
            events.push(event)
          }
        }
      }
    )

    setConsoleEvents(events)
  }, [playback, setConsoleEvents])

  useEffect(() => {
    const events = Stats.time('ConsolePanel -> filter console events', () => {
      return consoleEvents.filter(event => {
        const levelBitField = enumToBitField(event.data.level)

        return (
          levelBitField & consoleLevelFilter &&
          event.data.parts.some(part => {
            return (
              part.type === MessagePartType.String &&
              part.value.includes(consoleSearch)
            )
          })
        )
      })
    })

    setFilteredConsoleEvents(events)
  }, [
    consoleEvents,
    consoleSearch,
    consoleLevelFilter,
    setFilteredConsoleEvents,
  ])

  return (
    <Grid gridTemplateRows="auto 1fr" height="100%">
      <Grid
        alignItems="center"
        gap={20}
        padding={10}
        gridTemplateColumns="2fr 2fr 1fr"
        borderBottom={`1px solid ${colors.slate['200']}`}
      >
        <SearchForm value={consoleSearch} onChange={setConsoleSearch} />

        <LevelFilter
          value={consoleLevelFilter}
          onChange={setConsoleLevelFilter}
        />

        <Block justifySelf="end" fontSize={13} color={colors.slate['500']}>
          {consoleEvents.length !== filteredConsoleEvents.length &&
            `${consoleEvents.length - filteredConsoleEvents.length} hidden`}
        </Block>
      </Grid>

      <Block overflow="auto">
        {filteredConsoleEvents.map((event, i) => (
          <ConsoleRow event={event} key={i} />
        ))}
      </Block>
    </Grid>
  )
}
