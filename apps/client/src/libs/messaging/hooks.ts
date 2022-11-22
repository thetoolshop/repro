import { useContext, useMemo } from 'react'
import { MessagingContext } from './context'
import { createApiCaller } from './createApiCaller'

export function useMessaging() {
  return useContext(MessagingContext)
}
