import { Atom, createAtom, Setter } from '@repro/atom'
import { SourceEvent } from '@repro/domain'
import { Pane } from './types'

export interface State {
  $selectedEvent: Atom<SourceEvent | null>
  $visiblePane: Atom<Pane | null>
  setSelectedEvent: Setter<SourceEvent | null>
  setVisiblePane: Setter<Pane | null>
}

const defaultValues = {
  selectedEvent: null,
  visiblePane: null,
}

export function createState(
  initialValues: Partial<typeof defaultValues> = defaultValues
): State {
  const [$selectedEvent, setSelectedEvent] = createAtom<SourceEvent | null>(
    initialValues.selectedEvent ?? defaultValues.selectedEvent
  )

  const [$visiblePane, setVisiblePane] = createAtom<Pane | null>(
    initialValues.visiblePane ?? defaultValues.visiblePane
  )

  return {
    $selectedEvent,
    $visiblePane,
    setSelectedEvent,
    setVisiblePane,
  }
}
