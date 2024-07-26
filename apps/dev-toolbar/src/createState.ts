import { Atom, createAtom, Setter } from '@repro/atom'
import { SourceEvent } from '@repro/domain'
import { Pane } from './types'

export interface State {
  $selectedEvent: Atom<SourceEvent | null>
  $selectedIndex: Atom<number | null>
  $visiblePane: Atom<Pane | null>
  setSelectedEvent: Setter<SourceEvent | null>
  setSelectedIndex: Setter<number | null>
  setVisiblePane: Setter<Pane | null>
}

const defaultValues = {
  selectedEvent: null,
  selectedIndex: null,
  visiblePane: null,
}

export function createState(
  initialValues: Partial<typeof defaultValues> = defaultValues
): State {
  const [$selectedEvent, setSelectedEvent] = createAtom<SourceEvent | null>(
    initialValues.selectedEvent ?? defaultValues.selectedEvent
  )

  const [$selectedIndex, setSelectedIndex] = createAtom<number | null>(
    initialValues.selectedIndex ?? defaultValues.selectedIndex
  )

  const [$visiblePane, setVisiblePane] = createAtom<Pane | null>(
    initialValues.visiblePane ?? defaultValues.visiblePane
  )

  return {
    $selectedEvent,
    $selectedIndex,
    $visiblePane,
    setSelectedEvent,
    setSelectedIndex,
    setVisiblePane,
  }
}
