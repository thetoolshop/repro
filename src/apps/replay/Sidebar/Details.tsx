import { Block } from 'jsxstyle'
import React, { useContext, useState } from 'react'

import { DragHandle } from '@/components/DragHandle'
import { Discussion } from './Discussion'
import { Settings } from './Settings'
import { Timeline } from './Timeline'
import { View, ViewContext } from './view'

const MIN_SIZE = 300
const MAX_SIZE = 600
const INITIAL_SIZE = 300

export const Details: React.FC = () => {
  const [activeView] = useContext(ViewContext)
  const [size, setSize] = useState(INITIAL_SIZE)
  const [initialSize, setInitialSize] = useState(INITIAL_SIZE)

  const handleDrag = (offset: number) => {
    setSize(Math.max(MIN_SIZE, Math.min(MAX_SIZE, initialSize + offset)))
  }

  const handleDragStart = () => {
    setInitialSize(size)
  }

  const handleDragEnd = () => {
    setInitialSize(size)
  }

  return (
    <Block position="relative" width={size}>
      {activeView === View.Discussion && <Discussion />}
      {activeView === View.Timeline && <Timeline />}
      {activeView === View.Settings && <Settings />}

      <DragHandle
        edge="right"
        onDrag={handleDrag}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    </Block>
  )
}
