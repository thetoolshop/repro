import { colors } from '@repro/design'
import { NetworkEvent, NetworkMessageType } from '@repro/domain'
import { Block, Row } from 'jsxstyle'
import {
  ArrowUp as FetchRequestIcon,
  ArrowUpDown as WebSocketIcon,
} from 'lucide-react'
import React from 'react'
import { useView } from '../../hooks'
import { View } from '../../types'
import { BaseEntry } from './BaseEntry'

interface Props {
  eventIndex: number
  event: NetworkEvent
}

const icons = {
  // Ignored network events
  [NetworkMessageType.FetchResponse]: null,
  [NetworkMessageType.WebSocketClose]: null,
  [NetworkMessageType.WebSocketInbound]: null,
  [NetworkMessageType.WebSocketOutbound]: null,

  [NetworkMessageType.FetchRequest]: (
    <FetchRequestIcon size={16} color={colors.emerald['500']} />
  ),

  [NetworkMessageType.WebSocketOpen]: (
    <WebSocketIcon size={16} color={colors.blue['500']} />
  ),
}

export const NetworkEntry: React.FC<Props> = ({ eventIndex, event }) => {
  const [, setView] = useView()

  const icon = icons[event.data.type]
  let content: React.ReactNode = null

  switch (event.data.type) {
    case NetworkMessageType.FetchRequest:
      content = (
        <Row alignItems="center" gap={5}>
          <Block
            padding={5}
            borderRadius={4}
            backgroundColor={colors.slate['100']}
            color={colors.slate['700']}
            fontSize={13}
            fontWeight={700}
            textTransform="uppercase"
          >
            {event.data.method}
          </Block>

          <Block>{event.data.url}</Block>
        </Row>
      )
      break

    case NetworkMessageType.WebSocketOpen:
      content = (
        <Row alignItems="center" gap={5}>
          <Block
            padding={5}
            borderRadius={4}
            backgroundColor={colors.slate['100']}
            color={colors.slate['700']}
            fontSize={13}
            fontWeight={700}
          >
            WS
          </Block>

          <Block>{event.data.url}</Block>
        </Row>
      )
      break
  }

  function onClick() {
    setView(View.Network)
  }

  return (
    <BaseEntry
      eventIndex={eventIndex}
      event={event}
      icon={icon}
      onClick={onClick}
    >
      {content}
    </BaseEntry>
  )
}
