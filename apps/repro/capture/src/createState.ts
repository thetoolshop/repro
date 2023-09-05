import { Atom, createAtom, Setter } from '@repro/atom'
import { RecordingMode, User } from '@repro/domain'
import { ReadyState } from './types'

export interface State {
  $active: Atom<boolean>
  $currentUser: Atom<User | null>
  $recordingMode: Atom<RecordingMode>
  $readyState: Atom<ReadyState>
  setActive: Setter<boolean>
  setCurrentUser: Setter<User | null>
  setRecordingMode: Setter<RecordingMode>
  setReadyState: Setter<ReadyState>
}

const defaultValues = {
  active: false,
  currentUser: null,
  recordingMode: RecordingMode.None,
  readyState: ReadyState.Idle,
}

export function createState(
  initialValues: Partial<typeof defaultValues> = defaultValues
): State {
  const [$active, setActive] = createAtom(
    initialValues.active ?? defaultValues.active
  )

  const [$currentUser, setCurrentUser] = createAtom<User | null>(
    initialValues.currentUser ?? defaultValues.currentUser
  )

  const [$recordingMode, setRecordingMode] = createAtom(
    initialValues.recordingMode ?? defaultValues.recordingMode
  )

  const [$readyState, setReadyState] = createAtom(
    initialValues.readyState ?? defaultValues.readyState
  )

  return {
    $active,
    $currentUser,
    $recordingMode,
    $readyState,
    setActive,
    setCurrentUser,
    setRecordingMode,
    setReadyState,
  }
}
