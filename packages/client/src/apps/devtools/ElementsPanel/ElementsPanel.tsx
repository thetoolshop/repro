import { Block, Grid } from 'jsxstyle'
import React, { useState } from 'react'
import { ElementTree } from '@/components/ElementTree'
import { colors } from '@/config/theme'
import { useSnapshot } from '@/libs/playback'
import { useTargetNodeId } from '../hooks'
import { TargetNodeComputedStyle } from './TargetNodeComputedStyle'

export const ElementsPanel: React.FC = () => {
  return (
    <Container>
      <MainPane />
      <SidebarPane />
    </Container>
  )
}

const Container: React.FC = ({ children }) => (
  <Grid gridTemplateColumns="1fr auto" alignItems="stretch" height="100%">
    {children}
  </Grid>
)

const MainPane: React.FC = React.memo(() => {
  const [targetNodeId, setTargetNodeId] = useTargetNodeId()
  const snapshot = useSnapshot()

  return (
    <Block height="100%" overflow="auto">
      {snapshot.dom && (
        <ElementTree
          vtree={snapshot.dom}
          targetNodeId={targetNodeId}
          selectNode={setTargetNodeId}
        />
      )}
    </Block>
  )
})

const INITIAL_SIDEBAR_SIZE = 360

const SidebarPane: React.FC = () => {
  const [size, setSize] = useState(INITIAL_SIDEBAR_SIZE)
  const [initialSize, setInitialSize] = useState(INITIAL_SIDEBAR_SIZE)

  return (
    <Block
      height="100%"
      width={size}
      overflow="auto"
      borderLeft={`1px solid ${colors.blueGray['200']}`}
    >
      <TargetNodeComputedStyle />
    </Block>
  )
}
