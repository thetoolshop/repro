import { useRecordingStream } from '@/libs/record'
import { isElementNode } from '@/utils/dom'
import { useAtomState } from '@/utils/state'
import { useContext, useEffect, useState } from 'react'
import {
  fromEvent,
  map,
  mapTo,
  NEVER,
  of,
  race,
  Subscription,
  take,
} from 'rxjs'
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

export function useCurrentDocument() {
  const state = useDevtoolsState()
  return useAtomState(state.$currentDocument)
}

export function useTargetNodeId() {
  const state = useDevtoolsState()
  return useAtomState(state.$targetNodeId)
}

export function useMask() {
  const state = useDevtoolsState()
  return useAtomState(state.$mask)
}

export function useSize() {
  const state = useDevtoolsState()
  return useAtomState(state.$size)
}

export function useView() {
  const state = useDevtoolsState()
  return useAtomState(state.$view)
}

export function useTargetElement() {
  const [currentDocument] = useCurrentDocument()
  const [targetNodeId] = useTargetNodeId()

  return currentDocument && targetNodeId
    ? currentDocument.querySelector(`[data-repro-node="${targetNodeId}"]`)
    : null
}

export function useTargetElementBoundingBox() {
  const targetElement = useTargetElement()
  const [boundingBox, setBoundingBox] = useState<DOMRect | null>(null)

  useEffect(() => {
    setBoundingBox(
      targetElement !== null ? targetElement.getBoundingClientRect() : null
    )
  }, [targetElement, setBoundingBox])

  return boundingBox
}

export function useTargetVNode() {
  const stream = useRecordingStream()
  const [targetNodeId] = useTargetNodeId()
  return targetNodeId ? stream.peek(targetNodeId) : null
}
