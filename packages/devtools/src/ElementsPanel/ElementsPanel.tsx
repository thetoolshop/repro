import { colors, ElementTree } from '@repro/design'
import { VElement, VTree } from '@repro/domain'
import { useSnapshot } from '@repro/playback'
import { isDocumentVNode, isElementVNode } from '@repro/vdom-utils'
import { Block, Grid } from 'jsxstyle'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { useElementPicker, useFocusedNode, useSelectedNode } from '../hooks'
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
  const [picker] = useElementPicker()
  const snapshot = useSnapshot()

  useEffect(() => {
    setSelectedNode(selectedNode => {
      const vtree = snapshot.dom

      if (vtree) {
        if (selectedNode && vNodeExists(vtree, selectedNode)) {
          return selectedNode
        }

        const bodyElement = vtree ? getBodyVElement(vtree) : null

        if (bodyElement) {
          return bodyElement.id
        }
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
  const [size, _setSize] = useState(INITIAL_SIDEBAR_SIZE)
  const [_initialSize, _setInitialSize] = useState(INITIAL_SIDEBAR_SIZE)

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

function vNodeExists(vtree: VTree, nodeId: string): boolean {
  return !!vtree.nodes[nodeId]
}
