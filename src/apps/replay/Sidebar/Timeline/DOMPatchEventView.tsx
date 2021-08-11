import { Block, InlineBlock, Row } from 'jsxstyle'
import React from 'react'
import { Crosshair as ElementPickerIcon } from 'react-feather'
import { colors } from '@/config/theme'
import { DOMPatchEvent } from '@/types/source'
import { PatchType } from '@/types/vdom'
import { EventHeader } from './EventHeader'

interface Props {
  event: DOMPatchEvent
}

function getSecondaryLabel(type: PatchType) {
  switch (type) {
    case PatchType.Attribute:
      return 'Attribute'

    case PatchType.AddNodes:
      return 'Add Nodes'

    case PatchType.RemoveNodes:
      return 'Remove Nodes'

    case PatchType.Text:
      return 'Text'
  }
}

export const DOMPatchEventView: React.FC<Props> = ({ event }) => {
  return (
    <Block padding="1rem">
      <EventHeader
        colorGroup={colors.green}
        primaryLabel="Element"
        secondaryLabel={getSecondaryLabel(event.data.type)}
        time={event.time}
      />

      <Row
        alignItems="center"
        borderRadius={2}
        gap="0.5rem"
        marginV="1rem"
      >
        <Block alignItems="center" color={colors.blueGray['800']}>Target</Block>

        <Row
          alignItems="center"
          backgroundColor={colors.blueGray['100']}
          gap="0.5rem"
          hoverBackgroundColor={colors.blue['100']}
          padding="0.5rem"
          userSelect="none"
        >
          <Block color={colors.blueGray['500']}>
            <ElementPickerIcon size={12} />
          </Block>

          <Block fontFamily="monospace">
            <InlineBlock color={colors.blueGray['500']}>&lt;</InlineBlock>
            <InlineBlock color={colors.blue['700']}>div</InlineBlock>
            <InlineBlock color={colors.blueGray['500']}>&gt;</InlineBlock>
          </Block>
        </Row>
      </Row>
    </Block>
  )
}
