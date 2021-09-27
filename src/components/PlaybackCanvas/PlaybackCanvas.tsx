import { attributesToProps } from 'html-react-parser'
import { Block } from 'jsxstyle'
import React from 'react'
import { FrameRealm } from '@/components/FrameRealm'
import { usePointer, useSnapshot } from '@/libs/playback'
import { VTree } from '@/types/vdom'
import { SyntheticId } from '@/types/common'
import { isDocumentVNode, isDocTypeVNode, isTextVNode } from '@/utils/vdom'
import {Stats} from '@/libs/stats'

const reactDOMFromSnapshot = (snapshot: VTree | null) => {
  const createReactElement = (nodeId: SyntheticId): React.ReactNode => {
    const vNode = snapshot!.nodes[nodeId]

    if (!vNode) {
      throw new Error(`Could not find VNode with ID "${nodeId}"`)
    }

    if (isTextVNode(vNode)) {
      return React.createElement(
        React.Fragment,
        { key: nodeId },
        vNode.value
      )
    }

    if (isDocumentVNode(vNode)) {
      return React.createElement(
        React.Fragment,
        { key: nodeId },
        vNode.children.map(createReactElement)
      )
    }

    if (isDocTypeVNode(vNode)) {
      return null
    }

    if (vNode.tagName === 'html') {
      return React.createElement(
        React.Fragment,
        { key: nodeId },
        vNode.children.map(createReactElement)
      )
    }

    if (vNode.tagName === 'iframe') {
      return React.createElement(
        FrameRealm,
        { key: nodeId },
        vNode.children.map(createReactElement)
      )
    }

    const props: React.HTMLProps<HTMLElement> = {
      ...attributesToProps(vNode.attributes),
      key: nodeId,
    }

    if (vNode.attributes.hasOwnProperty('value')) {
      props.readOnly = true
    }

    return React.createElement(
      vNode.tagName,
      props,
      vNode.children.length
        ? vNode.children.map(createReactElement)
        : null,
    )
  }

  if (snapshot === null) {
    return null
  }

  return createReactElement(snapshot.rootId)
}

export const PlaybackCanvas: React.FC = () => {
  const snapshot = useSnapshot()
  const pointer = usePointer()

  return (
    <Block gridArea="canvas" position="relative">
      <FrameRealm>
        {reactDOMFromSnapshot(snapshot)}
      </FrameRealm>
      <PointerOverlay />
    </Block>
  )
}

const PointerOverlay: React.FC = () => (
  <Block
    position="absolute"
    top={0}
    left={0}
    bottom={0}
    right={0}
  />
)
