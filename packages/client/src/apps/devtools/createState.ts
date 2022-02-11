import { SyntheticId } from '@/types/common'
import { Atom, createAtom, Setter } from '@/utils/state'
import { INITIAL_SIZE } from './constants'
import { MutableNodeMap, Snap, View } from './types'

export interface State {
  $inspecting: Atom<boolean>
  $exporting: Atom<boolean>
  $picker: Atom<boolean>
  $currentDocument: Atom<Document | null>
  $nodeMap: Atom<MutableNodeMap>
  $targetNodeId: Atom<SyntheticId | null>
  $view: Atom<View>
  $mask: Atom<boolean>
  $size: Atom<number>
  $snap: Atom<Snap>

  setInspecting: Setter<boolean>
  setExporting: Setter<boolean>
  setPicker: Setter<boolean>
  setCurrentDocument: Setter<Document | null>
  setNodeMap: Setter<MutableNodeMap>
  setTargetNodeId: Setter<SyntheticId | null>
  setView: Setter<View>
  setMask: Setter<boolean>
  setSize: Setter<number>
  setSnap: Setter<Snap>
}

const defaultValues = {
  inspecting: false,
  exporting: false,
  picker: false,
  currentDocument: null,
  targetNodeId: null,
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
  const [$exporting, _getExporting, setExporting] = createAtom(
    initialValues.exporting ?? false
  )
  const [$picker, _getPicker, setPicker] = createAtom(
    initialValues.picker ?? false
  )
  const [$currentDocument, _getCurrentDocument, setCurrentDocument] =
    createAtom<Document | null>(initialValues.currentDocument ?? null)
  const [$nodeMap, _getNodeMap, setNodeMap] = createAtom<MutableNodeMap>({})
  const [$targetNodeId, _getTargetNodeId, setTargetNodeId] =
    createAtom<SyntheticId | null>(initialValues.targetNodeId ?? null)
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
    $exporting,
    $picker,
    $currentDocument,
    $nodeMap,
    $targetNodeId,
    $view,
    $mask,
    $size,
    $snap,

    setInspecting,
    setExporting,
    setPicker,
    setCurrentDocument,
    setNodeMap,
    setTargetNodeId,
    setView,
    setMask,
    setSize,
    setSnap,
  }
}
