import { User } from '@repro/domain'
import React, { PropsWithChildren, useContext } from 'react'
import { Atom, createAtom, Setter, useAtomState } from '~/utils/state'

export interface State {
  $currentUser: Atom<User | null>
  setCurrentUser: Setter<User | null>
}

const defaultValues = {
  currentUser: null,
}

export function createState(
  initialValues: Partial<typeof defaultValues> = defaultValues
): State {
  const [$currentUser, _getCurrentUser, setCurrentUser] =
    createAtom<User | null>(
      initialValues.currentUser ?? defaultValues.currentUser
    )

  return {
    $currentUser,
    setCurrentUser,
  }
}

const defaultState = createState()
const GlobalStateContext = React.createContext(defaultState)

interface Props {
  state?: State
}

export const GlobalStateProvider: React.FC<PropsWithChildren<Props>> = ({
  children,
  state = defaultState,
}) => (
  <GlobalStateContext.Provider value={state}>
    {children}
  </GlobalStateContext.Provider>
)

export function useGlobalState() {
  return useContext(GlobalStateContext)
}

export function useCurrentUser() {
  const state = useGlobalState()
  return useAtomState(state.$currentUser)
}
