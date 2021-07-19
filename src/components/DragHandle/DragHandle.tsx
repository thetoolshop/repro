import { Block } from 'jsxstyle'
import React, { useCallback, useEffect, useState } from 'react'
import { colors } from '@/config/theme'

interface Props {
  edge: 'top' | 'bottom' | 'left' | 'right'
  onDragStart(): void
  onDragEnd(): void
  onDrag(offset: number): void
}

export const DragHandle: React.FC<Props> = ({ edge, onDrag, onDragEnd, onDragStart }) => {
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState<number | null>(null)

  const handleDown = (evt: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true)
    setStart(edge === 'top' || edge === 'bottom' ? evt.pageY : evt.pageX)
    onDragStart()
  }

  const handleUp = useCallback(() => {
    setDragging(false)
    setStart(null)
    onDragEnd()
  }, [setDragging, setStart])

  const handleMove = useCallback((evt: PointerEvent) => {
    if (dragging && start !== null) {
      const position = edge === 'top' || edge === 'bottom'
        ? evt.pageY
        : evt.pageX

      const offset = edge === 'top' || edge === 'left'
        ? start - position
        : position - start

      onDrag(offset)
    }
  }, [dragging, edge, onDrag, start])

  useEffect(() => {
    window.addEventListener('pointerup', handleUp)
    return () => window.removeEventListener('pointerup', handleUp)
  }, [handleUp])

  useEffect(() => {
    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [handleMove])

  const positionStyles = ({
    position: 'absolute',
    top: edge === 'bottom' ? 'auto' : 0,
    bottom: edge === 'top' ? 'auto' : 0,
    left: edge === 'right' ? 'auto' : 0,
    right: edge === 'left' ? 'auto' : 0,
  } as const)

  const cursor = edge === 'top' || edge === 'bottom'
    ? 'ns-resize'
    : 'ew-resize'

  const borderWidth = [
    edge === 'top' ? '2px' : '0',
    edge === 'right' ? '2px' : '0',
    edge === 'bottom' ? '2px' : '0',
    edge === 'left' ? '2px' : '0',
  ].join(' ')

  const hoverBorderWidth = [
    edge === 'top' ? '4px' : '0',
    edge === 'right' ? '4px' : '0',
    edge === 'bottom' ? '4px' : '0',
    edge === 'left' ? '4px' : '0',
  ].join(' ')

  const sizeStyles = {
    height: edge === 'top' || edge === 'bottom' ? 4 : 'auto',
    width: edge === 'left' || edge === 'right' ? 4 : 'auto',
  }

  return (
    <Block
      {...positionStyles}
      {...sizeStyles}
      borderWidth={borderWidth}
      hoverBorderWidth={hoverBorderWidth}
      borderStyle="solid"
      borderColor={colors.blueGray['200']}
      hoverBorderColor={colors.blue['200']}
      boxSizing="border-box"
      cursor={cursor}
      transition="all linear 100ms"
      props={{
        onPointerDown: handleDown,
      }}
    />
  )
}
