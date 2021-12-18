import { useRecordingStream } from '@/libs/record'
import { isElementNode } from '@/utils/dom'
import { useAtomState } from '@/utils/state'
import { getNodeId } from '@/utils/vdom'
import { useContext, useEffect, useState } from 'react'
import { StateContext } from './context'

export function useDevtoolsState() {
  return useContext(StateContext)
}

export function useActive() {
  const state = useDevtoolsState()
  return useAtomState(state.$active)
}

export function usePicker() {
  const state = useDevtoolsState()
  return useAtomState(state.$picker)
}

export function useTargetNode() {
  const state = useDevtoolsState()
  return useAtomState(state.$targetNode)
}

export function useSize() {
  const state = useDevtoolsState()
  return useAtomState(state.$size)
}

export function useView() {
  const state = useDevtoolsState()
  return useAtomState(state.$view)
}

export function useTargetNodeBoundingBox() {
  const [targetNode] = useTargetNode()
  const [boundingBox, setBoundingBox] = useState<DOMRect | null>(null)

  useEffect(() => {
    setBoundingBox(
      targetNode !== null && isElementNode(targetNode)
        ? targetNode.getBoundingClientRect()
        : null
    )
  }, [targetNode, setBoundingBox])

  return boundingBox
}

export function useTargetNodeComputedStyle() {
  const [targetNode] = useTargetNode()
  const [computedStyle, setComputedStyle] =
    useState<CSSStyleDeclaration | null>(null)

  useEffect(() => {
    setComputedStyle(
      targetNode !== null && isElementNode(targetNode)
        ? window.getComputedStyle(targetNode)
        : null
    )
  }, [targetNode, setComputedStyle])

  return computedStyle
}

export function useTargetVNode() {
  const stream = useRecordingStream()
  const [targetNode] = useTargetNode()
  return targetNode ? stream.peek(getNodeId(targetNode)) : null
}
