import { SourceEvent } from '@repro/domain'
import { Block, Row } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import { colors } from '~/config/theme'
import { usePlayback } from '~/libs/playback'
import { formatDate } from '~/utils/date'

interface Props {
  eventIndex: number
  event: SourceEvent
  rowIndex: number
  style: React.CSSProperties
  color?: string
  icon?: React.ReactNode
  onClick?: () => void
}

export const BaseEntry: React.FC<PropsWithChildren<Props>> = ({
  children,
  eventIndex,
  event,
  rowIndex,
  style,
  color,
  icon,
  onClick,
}) => {
  const playback = usePlayback()

  function handleClick() {
    playback.seekToEvent(eventIndex)

    if (onClick) {
      onClick()
    }
  }

  return (
    <Row
      paddingH={15}
      alignItems="center"
      gap={5}
      overflow="hidden"
      fontSize={13}
      backgroundColor={rowIndex % 2 === 0 ? colors.slate['100'] : colors.white}
      hoverBackgroundColor={colors.blue['100']}
      color={color}
      cursor="pointer"
      style={style}
      props={{ onClick: handleClick }}
    >
      <Block color={colors.slate['500']}>
        {formatDate(event.time, 'seconds')}
      </Block>

      <Block>{icon}</Block>

      <Block
        paddingV={5}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {children}
      </Block>
    </Row>
  )
}
