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
import React, { PropsWithChildren } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { colors } from '~/config/theme'
import { Stats } from '~/libs/diagnostics'
import { formatTime } from '~/utils/date'
import { ElapsedMarker } from '../../ElapsedMarker'
import { WebSocketGroup } from '../types'

interface Props {
  group: WebSocketGroup
}

function binaryToHex(buf: ArrayBuffer) {
  return Stats.time('NetworkPanel -> Messages -> binaryToHex', () => {
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
  })
}

function binaryToString(buf: ArrayBuffer) {
  return Stats.time('NetworkPanel -> Messages -> binaryToString', () => {
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
  })
}

export const Messages: React.FC<Props> = ({ group }) => {
  const firstMessage = group.messages?.[0]

  return (
    <Block height="100%" fontSize={13}>
      {firstMessage && (
        <ElapsedMarker prevIndex={-1} nextIndex={firstMessage.index} />
      )}

      <AutoSizer disableWidth>
        {({ height }) => (
          <FixedSizeList
            height={height}
            width="100%"
            itemSize={32}
            itemCount={group.messages?.length || 0}
            itemData={group.messages}
          >
            {MessageRow}
          </FixedSizeList>
        )}
      </AutoSizer>
    </Block>
  )
}

interface MessageRowProps {
  time: number
  index: number
  data: WebSocketInbound | WebSocketOutbound
}

const MessageRow: React.FC<ListChildComponentProps<Array<MessageRowProps>>> = ({
  index,
  style,
  data: rows,
}) => {
  const row = rows[index]

  if (!row) {
    return null
  }

  const time = row.time
  const message = row.data

  const bgColor =
    message.type === NetworkMessageType.WebSocketOutbound
      ? colors.emerald['100']
      : colors.white

  const hoverBgColor =
    message.type === NetworkMessageType.WebSocketOutbound
      ? colors.emerald['200']
      : colors.slate['100']

  const nextIndex = rows[index + 1]?.index ?? Number.MAX_SAFE_INTEGER

  return (
    <Grid
      gridTemplateColumns="auto auto 1fr 80px"
      gridTemplateRows="28px 4px"
      backgroundColor={bgColor}
      hoverBackgroundColor={hoverBgColor}
      cursor="default"
      style={style}
    >
      <Cell color={colors.slate['500']} borderLeft="none">
        {formatTime(time, 'millis')}
      </Cell>

      <Cell>
        {message.type === NetworkMessageType.WebSocketOutbound ? (
          <OutboundIcon color={colors.emerald['700']} size={16} />
        ) : (
          <InboundIcon color={colors.rose['700']} size={16} />
        )}
      </Cell>

      <Cell overflow="hidden">
        {message.messageType === WebSocketMessageType.Binary
          ? binaryToHex(message.data)
          : binaryToString(message.data)}
      </Cell>

      <Cell color={colors.slate['500']}>
        {prettyBytes(message.data.byteLength)}
      </Cell>

      <Block gridColumn="1 / span 4">
        <ElapsedMarker prevIndex={row.index} nextIndex={nextIndex} />
      </Block>
    </Grid>
  )
}

const Cell: React.FC<PropsWithChildren<JsxstyleProps<false>>> = ({
  children,
  ...props
}) => (
  <Row
    alignItems="center"
    paddingH={10}
    borderLeft={`1px solid ${colors.slate['200']}`}
    lineHeight={1.25}
    {...props}
  >
    {children}
  </Row>
)
