import { SyntheticId } from '@/types/common'
import { Atom, createAtom, Setter } from '@/utils/state'
import { INITIAL_SIZE } from './constants'
import { MutableNodeMap, Snap, View } from './types'

export interface State {
  $inspecting: Atom<boolean>
  $reporting: Atom<boolean>
  $picker: Atom<boolean>
  $currentDocument: Atom<Document | null>
  $nodeMap: Atom<MutableNodeMap>
  $focusedNode: Atom<SyntheticId | null>
  $selectedNode: Atom<SyntheticId | null>
  $view: Atom<View>
  $mask: Atom<boolean>
  $size: Atom<number>
  $snap: Atom<Snap>

  setInspecting: Setter<boolean>
  setReporting: Setter<boolean>
  setPicker: Setter<boolean>
  setCurrentDocument: Setter<Document | null>
  setNodeMap: Setter<MutableNodeMap>
  setFocusedNode: Setter<SyntheticId | null>
  setSelectedNode: Setter<SyntheticId | null>
  setView: Setter<View>
  setMask: Setter<boolean>
  setSize: Setter<number>
  setSnap: Setter<Snap>
}

const defaultValues = {
  inspecting: false,
  reporting: false,
  picker: false,
  currentDocument: null,
  focusedNode: null,
  selectedNode: null,
  view: View.Elements,
  mask: false,
  size: INITIAL_SIZE,
  snap: 'bottom' as Snap,
}

export function createState(
  initialValues: Partial<typeof defaultValues> = defaultValues
): State {
  const [$inspecting, _getInspecting, setInspecting] = createAtom(
    initialValues.inspecting ?? false
  )
  const [$reporting, _getReporting, setReporting] = createAtom(
    initialValues.reporting ?? false
  )
  const [$picker, _getPicker, setPicker] = createAtom(
    initialValues.picker ?? false
  )
  const [$currentDocument, _getCurrentDocument, setCurrentDocument] =
    createAtom<Document | null>(initialValues.currentDocument ?? null)
  const [$nodeMap, _getNodeMap, setNodeMap] = createAtom<MutableNodeMap>({})
  const [$focusedNode, _getFocusedNode, setFocusedNode] =
    createAtom<SyntheticId | null>(initialValues.focusedNode ?? null)
  const [$selectedNode, _getSelectedNode, setSelectedNode] =
    createAtom<SyntheticId | null>(null)
  const [$view, _getView, setView] = createAtom(
    initialValues.view ?? View.Elements
  )
  const [$mask, _getMask, setMask] = createAtom(initialValues.mask ?? false)
  const [$size, _getSize, setSize] = createAtom(
    initialValues.size ?? INITIAL_SIZE
  )
  const [$snap, _getSnap, setSnap] = createAtom<Snap>(
    initialValues.snap ?? 'bottom'
  )

  return {
    $inspecting,
    $reporting,
    $picker,
    $currentDocument,
    $nodeMap,
    $focusedNode,
    $selectedNode,
    $view,
    $mask,
    $size,
    $snap,

    setInspecting,
    setReporting,
    setPicker,
    setCurrentDocument,
    setNodeMap,
    setFocusedNode,
    setSelectedNode,
    setView,
    setMask,
    setSize,
    setSnap,
  }
}
