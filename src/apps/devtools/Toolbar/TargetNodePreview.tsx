import { Block, InlineBlock, Row } from 'jsxstyle'
import React from 'react'
import colors from 'tailwindcss/colors'
import { useTargetNodeBoundingBox, useTargetVNode } from '../hooks'

export const TargetNodePreview: React.FC = () => {
  const boundingBox = useTargetNodeBoundingBox()
  const targetVNode = useTargetVNode()

  if (!targetVNode) {
    return null
  }

  return (
    <Row
      paddingH={15}
      gap={15}
      alignItems="center"
      alignSelf="stretch"
      backgroundColor={colors.blueGray['100']}
      transition="background-color 100ms linear"
    >
      {boundingBox && (
        <Row gap={5} fontSize={13}>
          <InlineBlock color={colors.pink['500']}>
            {round(boundingBox.width)}
          </InlineBlock>
          <InlineBlock color={colors.blueGray['400']}>x</InlineBlock>
          <InlineBlock color={colors.pink['500']}>
            {round(boundingBox.height)}
          </InlineBlock>
        </Row>
      )}
    </Row>
  )
}

function round(value: number) {
  return ((value * 100) | 0) / 100
}
