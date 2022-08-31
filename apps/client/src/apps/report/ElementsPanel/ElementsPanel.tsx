import { Block, Grid } from 'jsxstyle'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { ElementTree } from '~/components/ElementTree'
import { colors } from '~/config/theme'
import { useSnapshot } from '~/libs/playback'
import { VElement, VTree } from '@repro/domain'
import { isDocumentVNode, isElementVNode } from '~/utils/vdom'
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

const Container: React.FC<PropsWithChildren> = ({ children }) => (
  <Grid gridTemplateColumns="1fr auto" alignItems="stretch" height="100%">
    {children}
  </Grid>
)

const MainPane: React.FC = React.memo(() => {
  const [focusedNode, setFocusedNode] = useFocusedNode()
  const [selectedNode, setSelectedNode] = useSelectedNode()
  const [picker] = usePicker()
  const snapshot = useSnapshot()

  useEffect(() => {
    setSelectedNode(selectedNode => {
      if (selectedNode) {
        return selectedNode
      }

      const bodyElement = snapshot.dom ? getBodyVElement(snapshot.dom) : null

      if (bodyElement) {
        return bodyElement.id
      }

      return null
    })
  }, [setSelectedNode, snapshot.dom])

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

function getBodyVElement(vtree: VTree): VElement | null {
  const rootNode = vtree.nodes[vtree.rootId]

  if (!rootNode || !isDocumentVNode(rootNode)) {
    return null
  }

  const documentElementNode = rootNode.children
    .map(childId => vtree.nodes[childId])
    .find(node => node && isElementVNode(node) && node.tagName === 'html')

  if (!documentElementNode || !isElementVNode(documentElementNode)) {
    return null
  }

  const bodyNode = documentElementNode.children
    .map(childId => vtree.nodes[childId])
    .find(node => node && isElementVNode(node) && node.tagName === 'body')

  if (!bodyNode || !isElementVNode(bodyNode)) {
    return null
  }

  return bodyNode
}
