import { RequestType } from '@repro/domain'
import { Block, Row } from 'jsxstyle'
import { JsxstyleProps } from 'jsxstyle/lib/types'
import { SkipForward } from 'lucide-react'
import prettyBytes from 'pretty-bytes'
import prettyMilliseconds from 'pretty-ms'
import React, { PropsWithChildren, useCallback, useState } from 'react'
import { colors } from '~/config/theme'
import { usePlayback } from '~/libs/playback'
import { formatTime } from '~/utils/date'
import { FetchGroup, WebSocketGroup } from './types'

interface Props {
  eventGroup: FetchGroup | WebSocketGroup
  selected?: boolean
  onSelect(): void
}

function getContentByteLength(
  group: FetchGroup | WebSocketGroup
): number | null {
  const byteLength =
    group.type === 'fetch'
      ? group.response?.body.byteLength
      : group.messages?.reduce(
          (sum, message) => sum + message.data.data.byteLength,
          0
        )

  return byteLength ?? null
}

function getRequestTiming(group: FetchGroup | WebSocketGroup): number | null {
  if (group.type === 'ws') {
    return null
  }

  if (!group.responseTime) {
    return null
  }

  return group.responseTime - group.requestTime
}

export const NetworkRow: React.FC<Props> = ({
  eventGroup,
  onSelect,
  selected,
}) => {
  const playback = usePlayback()
  const [hover, setHover] = useState(false)

  const onSeek = useCallback(() => {
    playback.seekToEvent(
      eventGroup.type === 'fetch'
        ? eventGroup.requestIndex
        : eventGroup.openIndex
    )
  }, [playback, eventGroup])

  function onMouseEnter() {
    setHover(true)
  }

  function onMouseLeave() {
    setHover(false)
  }

  const bgColor = selected
    ? colors.blue['100']
    : hover
    ? colors.slate['100']
    : colors.white

  const startTime =
    eventGroup.type === 'fetch' ? eventGroup.requestTime : eventGroup.openTime

  const url =
    eventGroup.type === 'fetch' ? eventGroup.request.url : eventGroup.open.url

  const displayType =
    eventGroup.type === 'fetch'
      ? eventGroup.request.requestType === RequestType.Fetch
        ? 'fetch'
        : 'xhr'
      : 'ws'

  const status =
    eventGroup.type === 'fetch' ? eventGroup.response?.status ?? null : null

  const contentLength = getContentByteLength(eventGroup)
  const requestTiming = getRequestTiming(eventGroup)

  return (
    <Block
      display="contents"
      paddingH={15}
      overflowX="hidden"
      fontSize={13}
      color={
        status !== null && status > 399
          ? colors.rose['700']
          : colors.slate['700']
      }
      cursor="default"
      props={{ onClick: onSelect, onMouseEnter, onMouseLeave }}
    >
      <Block
        paddingV={10}
        paddingH={10}
        position="relative"
        backgroundColor={bgColor}
        color={colors.slate['500']}
        lineHeight={1.25}
        cursor="pointer"
        props={{ onClick: onSeek }}
      >
        {formatTime(startTime, 'millis')}

        <Row
          alignItems="center"
          gap={5}
          position="absolute"
          left={0}
          top="50%"
          transform="translate(5px, -50%)"
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

      <Cell
        overflow="hidden"
        backgroundColor={bgColor}
        color={colors.slate['900']}
      >
        <Block overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
          {url}
        </Block>
      </Cell>

      <Cell backgroundColor={bgColor}>{status}</Cell>

      <Cell backgroundColor={bgColor}>{displayType}</Cell>

      <Cell backgroundColor={bgColor}>
        {contentLength !== null ? prettyBytes(contentLength) : null}
      </Cell>

      <Cell backgroundColor={bgColor}>
        {requestTiming ? prettyMilliseconds(requestTiming) : null}
      </Cell>

      <Cell backgroundColor={bgColor} alignSelf="stretch" />
    </Block>
  )
}

const Cell: React.FC<PropsWithChildren<JsxstyleProps<false>>> = ({
  children,
  ...props
}) => (
  <Row
    alignSelf="stretch"
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
