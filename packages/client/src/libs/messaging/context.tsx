import React from 'react'
import { DEFAULT_AGENT } from './defaults'
import { Agent } from './types'

export const MessagingContext = React.createContext<Agent>(DEFAULT_AGENT)

interface Props {
  agent: Agent
}

export const MessagingProvider: React.FC<Props> = ({ children, agent }) => (
  <MessagingContext.Provider value={agent}>
    {children}
  </MessagingContext.Provider>
)
