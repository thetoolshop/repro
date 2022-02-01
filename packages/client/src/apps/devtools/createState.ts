import { SyntheticId } from '@/types/common'
import { Atom, createAtom, Setter } from '@/utils/state'
import { INITIAL_SIZE } from './constants'
import { Snap, View } from './types'

export interface State {
  $inspecting: Atom<boolean>
  $exporting: Atom<boolean>
  $picker: Atom<boolean>
  $currentDocument: Atom<Document | null>
  $targetNodeId: Atom<SyntheticId | null>
  $view: Atom<View>
  $mask: Atom<boolean>
  $size: Atom<number>
  $snap: Atom<Snap>

  setInspecting: Setter<boolean>
  setExporting: Setter<boolean>
  setPicker: Setter<boolean>
  setCurrentDocument: Setter<Document | null>
  setTargetNodeId: Setter<SyntheticId | null>
  setView: Setter<View>
  setMask: Setter<boolean>
  setSize: Setter<number>
  setSnap: Setter<Snap>
}

export function createState(): State {
  const [$inspecting, _getInspecting, setInspecting] = createAtom(false)
  const [$exporting, _getExporting, setExporting] = createAtom(false)
  const [$picker, _getPicker, setPicker] = createAtom(false)
  const [$currentDocument, _getCurrentDocument, setCurrentDocument] =
    createAtom<Document | null>(null)
  const [$targetNodeId, _getTargetNodeId, setTargetNodeId] =
    createAtom<SyntheticId | null>(null)
  const [$view, _getView, setView] = createAtom(View.Elements)
  const [$mask, _getMask, setMask] = createAtom(false)
  const [$size, _getSize, setSize] = createAtom(INITIAL_SIZE)
  const [$snap, _getSnap, setSnap] = createAtom<Snap>('bottom')

  return {
    $inspecting,
    $exporting,
    $picker,
    $currentDocument,
    $targetNodeId,
    $view,
    $mask,
    $size,
    $snap,

    setInspecting,
    setExporting,
    setPicker,
    setCurrentDocument,
    setTargetNodeId,
    setView,
    setMask,
    setSize,
    setSnap,
  }
}
