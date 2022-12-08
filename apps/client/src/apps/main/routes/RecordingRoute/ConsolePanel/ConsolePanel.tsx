import {
  ConsoleEvent,
  LogLevel,
  SourceEvent,
  SourceEventType,
  SourceEventView,
  StackEntry,
} from '@repro/domain'
import { Block, Grid, InlineBlock } from 'jsxstyle'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { colors } from '~/config/theme'
import { Stats } from '~/libs/diagnostics'
import { usePlayback } from '~/libs/playback'
import { formatDate } from '~/utils/date'
import { PartRenderer } from './part-renderers/PartRenderer'

const bgColors = {
  [LogLevel.Error]: colors.rose['100'],
  [LogLevel.Info]: colors.white,
  [LogLevel.Warning]: colors.amber['50'],
  [LogLevel.Verbose]: colors.white,
}

const textColors = {
  [LogLevel.Error]: colors.rose['700'],
  [LogLevel.Info]: colors.slate['700'],
  [LogLevel.Warning]: colors.amber['700'],
  [LogLevel.Verbose]: colors.slate['700'],
}

const icons = {
  [LogLevel.Error]: <AlertTriangle size={16} color={colors.rose['700']} />,
  [LogLevel.Info]: <AlertCircle size={16} color={colors.blue['700']} />,
  [LogLevel.Warning]: <AlertTriangle size={16} color={colors.amber['700']} />,
  [LogLevel.Verbose]: <AlertCircle size={16} color={colors.slate['500']} />,
}

function isConsoleEvent(event: SourceEvent): event is ConsoleEvent {
  return event.type === SourceEventType.Console
}

export const ConsolePanel: React.FC = () => {
  const playback = usePlayback()
  const [consoleEvents, setConsoleEvents] = useState<Array<ConsoleEvent>>([])

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

  return (
    <Block>
      {consoleEvents.map(({ time, data: { level, parts, stack } }, i) => (
        <Grid
          key={i}
          gridTemplateColumns="auto auto 1fr auto"
          columnGap={10}
          rowGap={10}
          paddingV={5}
          paddingH={15}
          fontSize={13}
          color={textColors[level]}
          backgroundColor={bgColors[level]}
          borderColor={i > 0 ? colors.slate['100'] : 'transparent'}
          borderStyle="solid"
          borderWidth="4px 0 0"
        >
          <Block color={colors.slate['500']} lineHeight={1.25}>
            {formatDate(time, 'millis')}
          </Block>

          <Block>{icons[level]}</Block>

          <Block>
            {parts.map((part, j) => {
              return <PartRenderer part={part} key={j} />
            })}
          </Block>

          {stack[0] ? <StackReference entry={stack[0]} /> : <Block />}
        </Grid>
      ))}
    </Block>
  )
}

interface StackReferenceProps {
  entry: StackEntry
}

const StackReference: React.FC<StackReferenceProps> = ({ entry }) => (
  <InlineBlock lineHeight={1.25}>
    {entry.fileName}:{entry.lineNumber}
  </InlineBlock>
)
