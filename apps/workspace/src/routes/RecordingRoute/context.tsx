import React, { PropsWithChildren } from 'react'
import { createState, State } from './createState'

export const StateContext = React.createContext<State>(createState())

export const StateProvider: React.FC<PropsWithChildren<{ state: State }>> = ({
  children,
  state,
}) => <StateContext.Provider value={state}>{children}</StateContext.Provider>

export const NavigationContext = React.createContext((_pathname: string) => {})
