import { attributesToProps } from 'html-react-parser'
import { Attributes } from 'html-react-parser/lib/attributes-to-props'
import { Block } from 'jsxstyle'
import React, { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react'
import { Cursor } from '@/components/Cursor'
import { FrameRealm } from '@/components/FrameRealm'
import { colors } from '@/config/theme'
import { PointerState, usePointer, usePointerState, useSnapshot, useViewport } from '@/libs/playback'
import { VTree } from '@/types/vdom'
import { SyntheticId } from '@/types/common'
import { isDocumentVNode, isDocTypeVNode, isTextVNode } from '@/utils/vdom'

const reactDOMFromSnapshot = (snapshot: VTree | null) => {
  const createReactElement = (nodeId: SyntheticId, parentNodePath: Array<SyntheticId>): React.ReactNode => {
    const vNode = snapshot!.nodes[nodeId]
    const nodePath = [ ...parentNodePath, nodeId ]

    if (!vNode) {
      throw new Error(`Could not find VNode: ${nodePath.join(' > ')}`)
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
        vNode.children.map(childId => createReactElement(childId, nodePath))
      )
    }

    if (isDocTypeVNode(vNode)) {
      return null
    }

    if (vNode.tagName === 'html') {
      return React.createElement(
        React.Fragment,
        { key: nodeId },
        vNode.children.map(childId => createReactElement(childId, nodePath))
      )
    }

    if (vNode.tagName === 'iframe') {
      return React.createElement(
        FrameRealm,
        { key: nodeId },
        vNode.children.map(childId => createReactElement(childId, nodePath))
      )
    }

    const props: React.HTMLProps<HTMLElement> = {
      ...attributesToProps(vNode.attributes as Attributes),
      key: nodeId,
    }

    if (vNode.attributes.hasOwnProperty('value')) {
      props.readOnly = true
    }

    return React.createElement(
      vNode.tagName,
      props,
      vNode.children.length
        ? vNode.children.map(childId => createReactElement(childId, nodePath))
        : null,
    )
  }

  if (snapshot === null) {
    return null
  }

  return createReactElement(snapshot.rootId, [])
}

export const PlaybackCanvas: React.FC = () => {
  const snapshot = useSnapshot()

  return (
    <Block gridArea="canvas" overflow="hidden">
      <Viewport>
        <FrameRealm>
          {reactDOMFromSnapshot(snapshot)}
        </FrameRealm>
        <PointerOverlay />
      </Viewport>
    </Block>
  )
}

const Viewport: React.FC = ({ children }) => {
  const viewport = useViewport()

  const ref = useRef() as MutableRefObject<HTMLDivElement>
  const [scale, setScale] = useState(1)

  const onScale = useCallback((width: number, height: number) => {
    const widthScale = width / viewport[0]
    const heightScale = height / viewport[1]
    setScale(Math.min(1, widthScale, heightScale))
  }, [viewport, setScale])

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      let width: number | null = null
      let height: number | null = null

      for (const entry of entries) {
        const rect = entry.contentRect
        width = rect.width
        height = rect.height
      }

      if (width !== null && height !== null) {
        onScale(width, height)
      }
    })

    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect()
      onScale(width, height)
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [ref, onScale])

  return (
    <Block position="relative" props={{ ref }}>
      <Block
        width={viewport[0]}
        height={viewport[1]}
        transform={`scale(${scale})`}
        transformOrigin="0 0"
      >{children}</Block>
    </Block>
  )
}

const PointerOverlay: React.FC = () => {
  const [x, y] = usePointer()
  const pointerState = usePointerState()

  return (
    <Block
      position="absolute"
      top={0}
      left={0}
      bottom={0}
      right={0}
      overflow="hidden"
    >
      <Block
        position="absolute"
        transform={`translate(${x}px, ${y}px)`}
        transformOrigin="0 0"
      >
        <Block
          position="absolute"
          top={0}
          left={0}
          width={30}
          height={30}
          borderColor={colors.cyan['500']}
          borderStyle="solid"
          borderWidth={4}
          borderRadius={30}
          opacity={pointerState === PointerState.Up ? 0 : 0.75}
          transform="translate(-10px, -10px)"
          transition="opacity 100ms linear"
        />
        <Cursor color={colors.pink['700']} />
      </Block>
    </Block>
  )
}
