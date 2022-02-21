import React from 'react'
import { createLoopbackAgent } from './createLoopbackAgent'
import { Agent } from './types'

export const MessagingContext = React.createContext<Agent>(
  createLoopbackAgent()
)

interface Props {
  agent: Agent
}

export const MessagingProvider: React.FC<Props> = ({ children, agent }) => (
  <MessagingContext.Provider value={agent}>
    {children}
  </MessagingContext.Provider>
)
