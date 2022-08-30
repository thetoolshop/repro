import { RecordingMode } from '@repro/domain'
import { Atom, createAtom, Setter } from '@/utils/state'
import { ReadyState } from './types'

export interface State {
  $active: Atom<boolean>
  $recordingMode: Atom<RecordingMode>
  $readyState: Atom<ReadyState>
  setActive: Setter<boolean>
  setRecordingMode: Setter<RecordingMode>
  setReadyState: Setter<ReadyState>
}

const defaultValues = {
  active: false,
  recordingMode: RecordingMode.None,
  readyState: ReadyState.Idle,
}

export function createState(
  initialValues: Partial<typeof defaultValues> = defaultValues
): State {
  const [$active, _getActive, setActive] = createAtom(
    initialValues.active ?? false
  )

  const [$recordingMode, _getRecordingMode, setRecordingMode] = createAtom(
    initialValues.recordingMode ?? RecordingMode.None
  )

  const [$readyState, _getReadyState, setReadyState] = createAtom(
    initialValues.readyState ?? ReadyState.Idle
  )

  return {
    $active,
    $recordingMode,
    $readyState,
    setActive,
    setRecordingMode,
    setReadyState,
  }
}
