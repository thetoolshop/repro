import { Block } from 'jsxstyle'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { colors } from '@/config/theme'
import { SCALING_FACTOR } from './constants'
import mergeRefs from 'react-merge-refs'

function range(length: number): Array<number> {
  const output: Array<number> = []

  for (let i = 0; i < length; i++) {
    output.push(i)
  }

  return output
}

interface Props {
  maxValue: number
}

export const Meter = React.forwardRef<HTMLDivElement, Props>(
  ({ maxValue }, outerRef) => {
    const innerRef = useRef() as MutableRefObject<HTMLDivElement>
    const [width, setWidth] = useState(0)

    const ticks = Math.ceil(width / 10)

    useEffect(() => {
      const observer = new ResizeObserver(entries => {
        const element = entries[0]

        if (element) {
          setWidth(element.contentRect.width)
        }
      })

      if (innerRef.current) {
        setWidth(innerRef.current.offsetWidth)
        // TODO: investigate performance regression
        // observer.observe(innerRef.current)
      }

      return () => {
        observer.disconnect()
      }
    }, [innerRef, setWidth])

    return (
      <Block position="relative" height="100%">
        <Block
          position="relative"
          height="100%"
          background={colors.slate['100']}
          borderBottomWidth={1}
          borderBottomStyle="solid"
          borderBottomColor={colors.slate['300']}
          overflow="hidden"
          props={{ ref: innerRef }}
        >
          <Block
            position="absolute"
            top={0}
            right={0}
            height="100%"
            width={Math.min(width, maxValue / SCALING_FACTOR)}
            background={colors.slate['200']}
            props={{ ref: outerRef }}
          />
          <Block height="100%">
            {range(ticks).map(n => {
              const isMajorTick = n % 10 === 0
              const value = n * 100
              const isValueInBounds = value <= maxValue

              return (
                <React.Fragment key={n}>
                  <Block
                    width={1}
                    height={isMajorTick ? '50%' : '25%'}
                    position="absolute"
                    bottom={0}
                    right={n * (100 / SCALING_FACTOR)}
                    background={
                      isValueInBounds
                        ? isMajorTick
                          ? colors.blue['400']
                          : colors.blue['300']
                        : colors.slate['300']
                    }
                  />

                  {isMajorTick && (
                    <Block
                      position="absolute"
                      top={0}
                      right={n * (100 / SCALING_FACTOR)}
                      fontSize={10}
                      lineHeight={1.5}
                      color={colors.slate['700']}
                      transform="translateX(50%)"
                      pointerEvents="none"
                    >
                      {isValueInBounds && `${value}ms`}
                    </Block>
                  )}
                </React.Fragment>
              )
            })}
          </Block>
        </Block>
      </Block>
    )
  }
)
