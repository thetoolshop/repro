import { ConsoleEvent, LogLevel, StackEntry } from '@repro/domain'
import { Block, Grid, InlineBlock, Row } from 'jsxstyle'
import { AlertCircle, AlertTriangle, SkipForward } from 'lucide-react'
import React, { useCallback } from 'react'
import { colors } from '~/config/theme'
import { usePlayback } from '~/libs/playback'
import { formatDate } from '~/utils/date'
import { PartRenderer } from './PartRenderer'

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

interface Props {
  event: ConsoleEvent
  index: number
}

export const ConsoleRow: React.FC<Props> = ({
  event: {
    time,
    data: { level, parts, stack },
  },
  index,
}) => {
  const playback = usePlayback()

  const onSelect = useCallback(() => {
    playback.seekToEvent(index)
  }, [playback, index])

  return (
    <Grid
      gridTemplateColumns="auto auto 1fr auto"
      columnGap={10}
      rowGap={10}
      paddingV={5}
      paddingH={15}
      fontSize={13}
      color={textColors[level]}
      backgroundColor={bgColors[level]}
    >
      <Block
        position="relative"
        color={colors.slate['500']}
        lineHeight={1.25}
        cursor="pointer"
        props={{ onClick: onSelect }}
      >
        {formatDate(time, 'millis')}

        <Row
          alignItems="center"
          gap={5}
          position="absolute"
          left={0}
          top="50%"
          transform="translate(-10px, -50%)"
          padding={5}
          whiteSpace="nowrap"
          color={colors.white}
          backgroundColor={colors.blue['500']}
          borderRadius={4}
          opacity={0}
          hoverOpacity={1}
          userSelect="none"
          transition="opacity 100ms ease-in"
        >
          <SkipForward size={13} />
          <Block fontSize={11}>Go To Time</Block>
        </Row>
      </Block>

      <Block>{icons[level]}</Block>

      <Row flexWrap="wrap" gap={10}>
        {parts.map((part, j) => {
          return <PartRenderer part={part} key={j} />
        })}
      </Row>

      {stack[0] ? <StackReference entry={stack[0]} /> : <Block />}
    </Grid>
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
