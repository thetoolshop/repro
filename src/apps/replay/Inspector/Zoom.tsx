import { Block, Row } from 'jsxstyle'
import React, { useCallback, useEffect, useState } from 'react'
import { ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon } from 'react-feather'
import { colors } from '@/config/theme'

const MIN_POSITION = 5
const MAX_POSITION = 95
const INITIAL_POSITION = 50

function normalize(position: number) {
  const upper = MAX_POSITION - MIN_POSITION
  return 200 * (position - MIN_POSITION) / upper | 0
}

export const Zoom: React.FC = () => {
  const [position, setPosition] = useState(INITIAL_POSITION)
  const [initialPosition, setInitialPosition] = useState(INITIAL_POSITION)
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState<number | null>(null)

  const handleDown = (evt: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true)
    setStart(evt.pageX)
    setInitialPosition(position)
  }

  const handleUp = useCallback(() => {
    setDragging(false)
    setInitialPosition(position)
  }, [setDragging, setStart])

  const handleMove = useCallback(evt => {
    if (dragging && start !== null) {
      const offset = evt.pageX - start
      setPosition(Math.max(MIN_POSITION, Math.min(MAX_POSITION, initialPosition + offset)))
    }
  }, [dragging, initialPosition, start, setPosition])

  useEffect(() => {
    window.addEventListener('pointerup', handleUp)
    return () => window.removeEventListener('pointerup', handleUp)
  }, [handleUp])

  useEffect(() => {
    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [handleMove])

  return (
    <Row
      alignItems="center"
      marginLeft="auto"
      marginRight={10}
      userSelect="none"
    >
      <Block
        color={colors.blue['700']}
        fontSize={13}
        marginRight={5}
      >{normalize(position)}%</Block>

      <ZoomOutIcon
        color={colors.blue['700']}
        cursor="pointer"
        size={16}
      /> 

      <Block
        backgroundColor={colors.blue['700']}
        height={1}
        marginH={5}
        position="relative"
        width={120}
      >
        <Block
          backgroundColor={colors.blue['700']}
          borderRadius={10}
          cursor="col-resize"
          height={10}
          left={`${position}%`}
          position="absolute"
          top={0}
          transform="translate(-5px, -5px)"
          width={10}
          props={{
            onPointerDown: handleDown,
          }}
        />
      </Block>

      <ZoomInIcon
        color={colors.blue['700']}
        cursor="pointer"
        size={16}
      />
    </Row>
  )
}
