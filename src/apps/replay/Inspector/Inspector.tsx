import { Block, Grid, Row } from 'jsxstyle'
import React, { useState } from 'react'
import { DragHandle } from '@/components/DragHandle'
import { colors } from '@/config/theme'
import { ElementPicker } from './ElementPicker'
import { Tabs } from './Tabs'
import { Zoom } from './Zoom'
import { ViewContext, View } from './view'

const MIN_SIZE = 60
const MAX_SIZE = 480
const INITIAL_SIZE = 240

export const Inspector: React.FC = () => {
  const [view, setView] = useState(View.Elements)
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
    <ViewContext.Provider value={[view, setView]}>
      <Grid
        gridArea="inspector"
        gridTemplateRows="40px auto"
        height={size}
        position="relative"
      >

        <Header>
          <ElementPicker />
          <Separator />
          <Tabs />
          <Zoom />
        </Header>

        <DragHandle
          edge="top"
          onDrag={handleDrag}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </Grid>
    </ViewContext.Provider>
  )
}

const Header: React.FC = ({ children }) => (
  <Row
    alignItems="stretch"
    borderBottom={`1px solid ${colors.blueGray['200']}`}
  >{children}</Row>
)

const Separator: React.FC = () => (
  <Block
    alignSelf="center"
    backgroundColor={colors.blueGray['200']}
    height="calc(100% - 20px)"
    width={1}
  />
)
