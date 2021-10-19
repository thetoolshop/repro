import { Block } from 'jsxstyle'
import React from 'react'
import { Cursor } from '@/components/Cursor'
import { colors } from '@/config/theme'
import { PointerState, usePointer, usePointerState } from '@/libs/playback'

export const PointerOverlay: React.FC = () => {
  const [x, y] = usePointer()
  const pointerState = usePointerState()

  return (
    <Block
      position="absolute"
      top={0}
      left={0}
      bottom={0}
      right={0}
      overflow="hidden"
    >
      <Block
        position="absolute"
        transform={`translate(${x}px, ${y}px)`}
        transformOrigin="0 0"
      >
        <Block
          position="absolute"
          top={0}
          left={0}
          width={30}
          height={30}
          borderColor={colors.cyan['500']}
          borderStyle="solid"
          borderWidth={4}
          borderRadius={30}
          opacity={pointerState === PointerState.Up ? 0 : 0.75}
          transform="translate(-10px, -10px)"
          transition="opacity 100ms linear"
        />
        <Cursor color={colors.pink['700']} />
      </Block>
    </Block>
  )
}
