import {
  NetworkMessageType,
  WebSocketInbound,
  WebSocketMessageType,
  WebSocketOutbound,
} from '@repro/domain'
import { Block, Grid, Inline, Row } from 'jsxstyle'
import { JsxstyleProps } from 'jsxstyle/lib/types'
import {
  ChevronsUp as OutboundIcon,
  ChevronsDown as InboundIcon,
} from 'lucide-react'
import prettyBytes from 'pretty-bytes'
import React, { Fragment, PropsWithChildren } from 'react'
import { colors } from '~/config/theme'
import { formatTime } from '~/utils/date'
import { ElapsedMarker } from '../../ElapsedMarker'
import { pairwise } from '../../utils'
import { WebSocketGroup } from '../types'

interface Props {
  group: WebSocketGroup
}

function binaryToHex(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let output = ''

  for (const byte of bytes) {
    output += byte.toString(16).padStart(2, '0') + ' '
  }

  return (
    <Inline
      fontFamily="monospace"
      overflow="hidden"
      whiteSpace="nowrap"
      textOverflow="ellipsis"
    >
      {output}
    </Inline>
  )
}

function binaryToString(buf: ArrayBuffer) {
  return (
    <Inline
      fontFamily="monospace"
      overflow="hidden"
      whiteSpace="nowrap"
      textOverflow="ellipsis"
    >
      {new TextDecoder().decode(buf)}
    </Inline>
  )
}

export const Messages: React.FC<Props> = ({ group }) => {
  const messagePairs = pairwise(group.messages || [])

  return (
    <Grid
      gridTemplateColumns="auto auto 1fr max-content"
      alignItems="stretch"
      fontSize={13}
    >
      {messagePairs.map(([prev, event], i) => (
        <Fragment key={i}>
          <Block gridColumn="1 / span 4">
            <ElapsedMarker
              prevIndex={prev ? prev.index : -1}
              nextIndex={event ? event.index : Number.MAX_SAFE_INTEGER}
            />
          </Block>

          {event && (
            <MessageRow
              key={event.index}
              message={event.data}
              time={event.time}
              index={event.index}
            />
          )}
        </Fragment>
      ))}
    </Grid>
  )
}

interface MessageRowProps {
  time: number
  index: number
  message: WebSocketInbound | WebSocketOutbound
}

const MessageRow: React.FC<MessageRowProps> = ({ time, index, message }) => {
  const bgColor =
    message.type === NetworkMessageType.WebSocketOutbound
      ? colors.emerald['100']
      : colors.white

  return (
    <Fragment>
      <Cell
        backgroundColor={bgColor}
        color={colors.slate['500']}
        borderLeft="none"
      >
        {formatTime(time, 'millis')}
      </Cell>
      <Cell backgroundColor={bgColor}>
        {message.type === NetworkMessageType.WebSocketOutbound ? (
          <OutboundIcon color={colors.emerald['700']} size={16} />
        ) : (
          <InboundIcon color={colors.rose['700']} size={16} />
        )}
      </Cell>
      <Cell backgroundColor={bgColor} overflow="hidden">
        {message.messageType === WebSocketMessageType.Binary
          ? binaryToHex(message.data)
          : binaryToString(message.data)}
      </Cell>
      <Cell backgroundColor={bgColor} color={colors.slate['500']}>
        {prettyBytes(message.data.byteLength)}
      </Cell>
    </Fragment>
  )
}

const Cell: React.FC<PropsWithChildren<JsxstyleProps<false>>> = ({
  children,
  ...props
}) => (
  <Row
    alignItems="center"
    paddingV={10}
    paddingH={10}
    borderLeft={`1px solid ${colors.slate['200']}`}
    lineHeight={1.25}
    {...props}
  >
    {children}
  </Row>
)
