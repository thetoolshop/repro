import {
  ConsoleEvent,
  MessagePartType,
  SourceEvent,
  SourceEventType,
  SourceEventView,
} from '@repro/domain'
import { Block, Grid } from 'jsxstyle'
import React, { Fragment, useEffect, useState } from 'react'
import { colors } from '~/config/theme'
import { Stats } from '~/libs/diagnostics'
import { usePlayback } from '~/libs/playback'
import { useConsoleLevelFilter, useConsoleSearch } from '../hooks'
import { ConsoleRow } from './ConsoleRow'
import { ElapsedMarker } from './ElapsedMarker'
import { LevelFilter } from './LevelFilter'
import { SearchForm } from './SearchForm'
import { enumToBitField } from './util'

function isConsoleEvent(event: SourceEvent): event is ConsoleEvent {
  return event.type === SourceEventType.Console
}

function pairwise<T>(items: Array<T>): Array<[T | null, T | null]> {
  const pairs: Array<[T | null, T | null]> = []

  let prevItem: T | null = null
  let item: T | null = null

  for (let i = 0, len = items.length; i <= len; i++) {
    item = items[i] ?? null
    pairs.push([prevItem, item])
    prevItem = item
  }

  return pairs
}

export const ConsolePanel: React.FC = () => {
  const playback = usePlayback()
  const [consoleSearch, setConsoleSearch] = useConsoleSearch()
  const [consoleLevelFilter, setConsoleLevelFilter] = useConsoleLevelFilter()

  const [consoleEvents, setConsoleEvents] = useState<
    Array<[ConsoleEvent, number]>
  >([])

  const [filteredConsoleEvents, setFilteredConsoleEvents] = useState<
    Array<[ConsoleEvent, number]>
  >([])

  useEffect(() => {
    const events: Array<[ConsoleEvent, number]> = []

    Stats.time(
      'ConsolePanel -> get console messages from source events',
      () => {
        const sourceEvents = playback.getSourceEvents().toSource()
        let i = 0

        for (const view of sourceEvents) {
          const event = SourceEventView.over(view)

          if (isConsoleEvent(event)) {
            events.push([event, i])
          }

          i++
        }
      }
    )

    setConsoleEvents(events)
  }, [playback, setConsoleEvents])

  useEffect(() => {
    const events = Stats.time('ConsolePanel -> filter console events', () => {
      return consoleEvents.filter(([event]) => {
        const levelBitField = enumToBitField(event.data.level)

        return (
          levelBitField & consoleLevelFilter &&
          event.data.parts.some(part => {
            // TODO: apply search filter to Node and Date message parts
            return (
              part.type === MessagePartType.Node ||
              (part.type === MessagePartType.String &&
                part.value.includes(consoleSearch))
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

  const filteredPairs = pairwise(filteredConsoleEvents)

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
        {filteredPairs.map(([prev, event], i) => (
          <Fragment key={i}>
            <ElapsedMarker
              prevIndex={prev ? prev[1] : -1}
              nextIndex={event ? event[1] : Number.MAX_SAFE_INTEGER}
            />
            {event !== null && <ConsoleRow event={event[0]} index={event[1]} />}
          </Fragment>
        ))}
      </Block>
    </Grid>
  )
}
