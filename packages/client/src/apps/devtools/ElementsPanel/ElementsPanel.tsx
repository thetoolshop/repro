import { Block, Grid } from 'jsxstyle'
import React, { useState } from 'react'
import { ElementTree } from '@/components/ElementTree'
import { colors } from '@/config/theme'
import { useSnapshot } from '@/libs/playback'
import { useSelectedNode, useFocusedNode, usePicker } from '../hooks'
import { SelectedNodeComputedStyle } from './SelectedNodeComputedStyle'

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
  const [focusedNode, setFocusedNode] = useFocusedNode()
  const [selectedNode, setSelectedNode] = useSelectedNode()
  const [picker] = usePicker()
  const snapshot = useSnapshot()

  return (
    <Block height="100%" overflow="auto">
      {snapshot.dom && (
        <ElementTree
          vtree={snapshot.dom}
          focusedNode={focusedNode}
          selectedNode={selectedNode}
          onFocusNode={setFocusedNode}
          onSelectNode={setSelectedNode}
          usingPicker={picker}
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
      borderLeft={`1px solid ${colors.slate['200']}`}
    >
      <SelectedNodeComputedStyle />
    </Block>
  )
}
