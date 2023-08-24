import { useAtomState, useAtomValue } from '@repro/atom'
import { isElementNode } from '@repro/dom-utils'
import { useContext } from 'react'
import { useRecordingStream } from '~/libs/record'
import { NavigationContext, StateContext } from './context'

export function useDevtoolsState() {
  return useContext(StateContext)
}

// @deprecated
export function useActive() {
  const state = useDevtoolsState()
  return useAtomValue(state.$inspecting)
}

export function useInspecting() {
  const state = useDevtoolsState()
  return useAtomState(state.$inspecting)
}

export function usePicker() {
  const state = useDevtoolsState()
  return useAtomState(state.$picker)
}

export function useCurrentDocument() {
  const state = useDevtoolsState()
  return useAtomState(state.$currentDocument)
}

export function useNodeMap() {
  const state = useDevtoolsState()
  return useAtomState(state.$nodeMap)
}

export function useFocusedNode() {
  const state = useDevtoolsState()
  return useAtomState(state.$focusedNode)
}

export function useSelectedNode() {
  const state = useDevtoolsState()
  return useAtomState(state.$selectedNode)
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

export function useFocusedVNode() {
  const stream = useRecordingStream()
  const [focusedNode] = useFocusedNode()
  return focusedNode ? stream.peek(focusedNode) : null
}

export function useSelectedElement() {
  const [nodeMap] = useNodeMap()
  const [selectedNode] = useSelectedNode()
  const node = selectedNode ? nodeMap[selectedNode] || null : null
  return node && isElementNode(node) ? node : null
}

export function useNavigate() {
  return useContext(NavigationContext)
}

export function useConsoleSearch() {
  const state = useDevtoolsState()
  return useAtomState(state.$consoleSearch)
}

export function useConsoleLevelFilter() {
  const state = useDevtoolsState()
  return useAtomState(state.$consoleLevelFilter)
}
