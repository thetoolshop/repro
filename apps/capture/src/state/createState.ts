import { Atom, createAtom, Setter } from '@repro/atom'
import { RecordingMode } from '@repro/domain'
import { ReadyState } from './types'

export interface State {
  $readyState: Atom<ReadyState>
  $recordingMode: Atom<RecordingMode>
  setReadyState: Setter<ReadyState>
  setRecordingMode: Setter<RecordingMode>
}

const defaultValues = {
  readyState: ReadyState.Idle,
  recordingMode: RecordingMode.None,
}

export function createState(
  initialValues: Partial<typeof defaultValues> = defaultValues
): State {
  const [$readyState, setReadyState] = createAtom(
    initialValues.readyState ?? defaultValues.readyState
  )

  const [$recordingMode, setRecordingMode] = createAtom(
    initialValues.recordingMode ?? defaultValues.recordingMode
  )

  return {
    $readyState,
    $recordingMode,
    setReadyState,
    setRecordingMode,
  }
}
