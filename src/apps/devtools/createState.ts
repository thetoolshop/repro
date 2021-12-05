import { SyntheticId } from '@/types/common'
import { Atom, createAtom, Setter } from '@/utils/state'

export interface State {
  $active: Atom<boolean>
  $picker: Atom<boolean>
  $targetNodeId: Atom<SyntheticId | null>

  setActive: Setter<boolean>
  setPicker: Setter<boolean>
  setTargetNodeId: Setter<SyntheticId | null>
}

export function createState(): State {
  const [$active, getActive, setActive] = createAtom(false)
  const [$picker, getPicker, setPicker] = createAtom(false)
  const [$targetNodeId, getTargetNodeId, setTargetNodeId] =
    createAtom<SyntheticId | null>(null)

  return {
    $active,
    $picker,
    $targetNodeId,

    setActive,
    setPicker,
    setTargetNodeId,
  }
}
