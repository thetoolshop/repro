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
import { isDocumentVNode, isDocTypeVNode, isTextVNode, isStyleElementVNode, getNodeId } from '@/utils/vdom'
import {Point} from '@/types/interaction'

const HOVER_CLASS = '-repro-hover'
const HOVER_SELECTOR = `.${HOVER_CLASS}`

const reactDOMFromSnapshot = (snapshot: VTree | null, hoverTargets: Set<SyntheticId>) => {
  const createReactElement = (nodeId: SyntheticId, parentId: SyntheticId | null): React.ReactNode => {
    const vNode = snapshot ? snapshot.nodes[nodeId] : null
    const parentVNode = parentId && snapshot ? snapshot.nodes[parentId] : null

    if (!vNode) {
      throw new Error(`Could not find VNode: ${nodeId}`)
    }

    if (isTextVNode(vNode)) {
      let value = vNode.value

      // CSS hover states cannot be triggered programmatically.
      // Replace hover pseudo-selectors with class selector.
      if (parentVNode && isStyleElementVNode(parentVNode)) {
        value = value.replace(':hover', HOVER_SELECTOR)
      }

      return React.createElement(
        React.Fragment,
        { key: nodeId },
        value
      )
    }

    if (isDocumentVNode(vNode)) {
      return React.createElement(
        React.Fragment,
        { key: nodeId },
        vNode.children.map(childId => createReactElement(childId, nodeId))
      )
    }

    if (isDocTypeVNode(vNode)) {
      return null
    }

    if (vNode.tagName === 'html') {
      return React.createElement(
        React.Fragment,
        { key: nodeId },
        vNode.children.map(childId => createReactElement(childId, nodeId))
      )
    }

    if (vNode.tagName === 'iframe') {
      return React.createElement(
        FrameRealm,
        { key: nodeId },
        vNode.children.map(childId => createReactElement(childId, nodeId))
      )
    }

    const props: React.HTMLProps<HTMLElement> & { 'data-repro-id': SyntheticId } = {
      ...attributesToProps(vNode.attributes as Attributes),
      'data-repro-id': nodeId,
      key: nodeId,
    }

    if (vNode.attributes.hasOwnProperty('value')) {
      props.readOnly = true
    }

    if (hoverTargets.has(nodeId)) {
      props.className = `${props.className || ''} ${HOVER_CLASS}`
    }

    return React.createElement(
      vNode.tagName,
      props,
      vNode.children.length
        ? vNode.children.map(childId => createReactElement(childId, nodeId))
        : null,
    )
  }

  if (snapshot === null) {
    return null
  }

  return createReactElement(snapshot.rootId, null)
}

export const PlaybackCanvas: React.FC = () => {
  const frameRef = useRef() as MutableRefObject<HTMLIFrameElement>
  const snapshot = useSnapshot()
  const pointer = usePointer()
  const pointerState = usePointerState()
  const [hoverTargets, setHoverTargets] = useState(new Set<SyntheticId>())

  useEffect(() => {
    if (frameRef.current) {
      const doc = frameRef.current.contentDocument

      if (doc) {
        let target = doc.elementFromPoint(...pointer)
        const allTargets = new Set<SyntheticId>()

        while (target) {
          const nodeId = target.getAttribute('data-repro-id')

          if (nodeId) {
            allTargets.add(nodeId)
          }

          target = target.parentElement
        }

        setHoverTargets(allTargets)
      }
    }
  }, [frameRef, pointer])

  return (
    <Block gridArea="canvas" overflow="hidden">
      <Viewport>
        <FrameRealm ref={frameRef}>
          {reactDOMFromSnapshot(snapshot, hoverTargets)}
        </FrameRealm>

        <PointerOverlay
          pointer={pointer}
          state={pointerState}
        />
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

interface PointerOverlayProps {
  pointer: Point
  state: PointerState
}

const PointerOverlay: React.FC<PointerOverlayProps> = ({ pointer: [x, y], state }) => (
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
        opacity={state === PointerState.Up ? 0 : 0.75}
        transform="translate(-10px, -10px)"
        transition="opacity 100ms linear"
      />
      <Cursor color={colors.pink['700']} />
    </Block>
  </Block>
)
