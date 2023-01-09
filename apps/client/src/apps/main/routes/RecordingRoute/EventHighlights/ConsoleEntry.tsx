import { ConsoleEvent, LogLevel, MessagePartType } from '@repro/domain'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import React from 'react'
import { colors } from '~/config/theme'
import { BaseEntry } from './BaseEntry'

interface Props {
  eventIndex: number
  event: ConsoleEvent
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

export const ConsoleEntry: React.FC<Props> = ({ eventIndex, event }) => {
  const level = event.data.level
  const firstPart = event.data.parts[0]

  const textColor = textColors[level]
  const icon = icons[level]

  const value =
    firstPart?.type === MessagePartType.String ? firstPart.value : null

  return (
    <BaseEntry
      eventIndex={eventIndex}
      event={event}
      color={textColor}
      icon={icon}
    >
      {value}
    </BaseEntry>
  )
}
