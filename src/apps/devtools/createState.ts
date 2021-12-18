import { Atom, createAtom, Setter } from '@/utils/state'
import { INITIAL_SIZE } from './constants'
import { View } from './types'

export interface State {
  $active: Atom<boolean>
  $picker: Atom<boolean>
  $targetNode: Atom<Node | null>
  $view: Atom<View>
  $size: Atom<number>

  setActive: Setter<boolean>
  setPicker: Setter<boolean>
  setTargetNode: Setter<Node | null>
  setView: Setter<View>
  setSize: Setter<number>
}

export function createState(): State {
  const [$active, _getActive, setActive] = createAtom(false)
  const [$picker, _getPicker, setPicker] = createAtom(false)
  const [$targetNode, _getTargetNode, setTargetNode] = createAtom<Node | null>(
    null
  )
  const [$view, _getView, setView] = createAtom(View.Elements)
  const [$size, _getSize, setSize] = createAtom(INITIAL_SIZE)

  return {
    $active,
    $picker,
    $targetNode,
    $view,
    $size,

    setActive,
    setPicker,
    setTargetNode,
    setView,
    setSize,
  }
}
