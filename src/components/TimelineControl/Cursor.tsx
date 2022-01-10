import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import { SCALING_FACTOR } from './constants'

interface Props {
  type: 'cursor' | 'ghost'
  offset: number
  animateToZero: boolean
}

export const Cursor: React.FC<Props> = React.memo(
  ({ type, offset, animateToZero }) => {
    const duration = offset * SCALING_FACTOR

    const animation = {
      from: {
        transform: `translateX(-${offset}px)`,
      },

      to: {
        transform: `translateX(0)`,
      },
    }

    return (
      <Block
        height="100%"
        width={2}
        backgroundColor={
          type === 'cursor' ? colors.blue['500'] : colors.blueGray['400']
        }
        position="absolute"
        top={0}
        right={0}
        transform={`translateX(-${offset}px)`}
        animation={animation}
        animationDuration={`${duration}ms`}
        animationFillMode="forwards"
        animationTimingFunction="linear"
        animationPlayState={animateToZero ? 'running' : 'paused'}
        pointerEvents="none"
      >
        {type === 'cursor' && (
          <React.Fragment>
            <Block
              position="absolute"
              top={-3}
              left={-5}
              width={0}
              height={0}
              borderWidth={6}
              borderStyle="solid"
              borderTopColor={colors.blue['500']}
              borderBottomColor="transparent"
              borderLeftColor="transparent"
              borderRightColor="transparent"
            />

            <Block
              position="absolute"
              bottom={-3}
              left={-5}
              width={0}
              height={0}
              borderWidth={6}
              borderStyle="solid"
              borderTopColor="transparent"
              borderBottomColor={colors.blue['500']}
              borderLeftColor="transparent"
              borderRightColor="transparent"
            />
          </React.Fragment>
        )}
      </Block>
    )
  }
)
