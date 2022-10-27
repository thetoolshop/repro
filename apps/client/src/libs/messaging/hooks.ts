import { useContext, useMemo } from 'react'
import { MessagingContext } from './context'
import { createApiCaller } from './createApiCaller'

export function useMessaging() {
  return useContext(MessagingContext)
}

export function useApiCaller() {
  const agent = useMessaging()
  return useMemo(() => createApiCaller(agent), [agent])
}
