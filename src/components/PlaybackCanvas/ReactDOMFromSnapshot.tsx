import { attributesToProps } from 'html-react-parser'
import { Attributes } from 'html-react-parser/lib/attributes-to-props'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { FrameRealm } from '@/components/FrameRealm'
import { usePointer, useScrollStates, useSnapshot } from '@/libs/playback'
import { SyntheticId } from '@/types/common'
import { isDocumentVNode, isDocTypeVNode, isStyleElementVNode, isTextVNode } from '@/utils/vdom'
import { ScrollEffect } from './ScrollEffect'

interface Props {
  ownerDocument: Document | null
}

const HOVER_CLASS = '-repro-hover'
const HOVER_SELECTOR = `.${HOVER_CLASS}`

export const ReactDOMFromSnapshot: React.FC<Props> = ({ ownerDocument }) => {
  const snapshot = useSnapshot()
  const pointer = usePointer()
  const scrollStates = useScrollStates()
  
  const documentElement = useRef() as MutableRefObject<HTMLElement>
  const [hoverTargets, setHoverTargets] = useState(new Set<SyntheticId>())

  useEffect(() => {
    if (ownerDocument) {
      documentElement.current = ownerDocument.documentElement
    }
  }, [ownerDocument, documentElement])

  useEffect(() => {
    if (ownerDocument) {
      let target = ownerDocument.elementFromPoint(...pointer)
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
  }, [ownerDocument, pointer, setHoverTargets])

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

      return (
        <React.Fragment key={nodeId}>
          {value}
        </React.Fragment>
      )
    }

    if (isDocumentVNode(vNode)) {
      return (
        <React.Fragment key={nodeId}>
          {vNode.children.map(childId => createReactElement(childId, nodeId))}
        </React.Fragment>
      )
    }

    if (isDocTypeVNode(vNode)) {
      return null
    }

    if (vNode.tagName === 'html') {
      return (
        <ScrollEffect
          key={`${nodeId}-scroll`}
          state={scrollStates[nodeId] || null}
          elementRef={documentElement.current}
        >
          <React.Fragment key={nodeId}>
            {vNode.children.map(childId => createReactElement(childId, nodeId))}
          </React.Fragment>
        </ScrollEffect>
      )
    }

    if (vNode.tagName === 'iframe') {
      return (
        <FrameRealm key={nodeId}>
          {vNode.children.map(childId => createReactElement(childId, nodeId))}
        </FrameRealm>
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

    return (
      <ScrollEffect key={`${nodeId}-scroll`} state={scrollStates[nodeId] || [0, 0]}>
        {React.createElement(
          vNode.tagName,
          props,
          vNode.children.length
            ? vNode.children.map(childId => createReactElement(childId, nodeId))
            : null,
        )}
      </ScrollEffect>
    )
  }

  if (snapshot === null) {
    return null
  }

  return (
    <React.Fragment>
      {createReactElement(snapshot.rootId, null)}
    </React.Fragment>
  )
}
