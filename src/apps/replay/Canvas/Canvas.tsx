import { attributesToProps } from 'html-react-parser'
import { Block } from 'jsxstyle'
import React from 'react'
import { Sandbox } from '@/components/Sandbox'
import { useSnapshot } from '@/libs/playback'
import { NodeType, VTree } from '@/types/vdom'
import { SyntheticId } from '@/types/common'

const reactDOMFromSnapshot = (snapshot: VTree | null) => {
  const createReactElement = (nodeId: SyntheticId): React.ReactNode => {
    const vNode = snapshot!.nodes[nodeId]

    if (!vNode) {
      throw new Error(`Could not find VNode with ID "${nodeId}"`)
    }

    if (vNode.type === NodeType.Text) {
      return vNode.value
    }

    if (vNode.tagName === 'html') {
      return React.createElement(
        React.Fragment,
        null,
        vNode.children.map(createReactElement)
      )
    }

    return React.createElement(
      vNode.tagName,
      { ...attributesToProps(vNode.attributes), key: vNode.id },
      vNode.children.map(createReactElement)
    )
  }

  if (snapshot === null) {
    return null
  }

  return createReactElement(snapshot.rootId)
}

export const Canvas: React.FC = () => {
  const snapshot = useSnapshot()

  return (
    <Block gridArea="canvas">
      <Sandbox>
        {reactDOMFromSnapshot(snapshot)}
      </Sandbox>
    </Block>
  )
}
