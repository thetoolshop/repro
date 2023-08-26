import { useApiClient } from '@repro/api-client'
import { Avatar } from '@repro/design'
import { useFuture } from '@repro/future-utils'
import React from 'react'

export const MyAvatar: React.FC = () => {
  const apiClient = useApiClient()

  const {
    loading,
    error,
    result: user,
  } = useFuture(() => {
    return apiClient.user.getMyUser()
  }, [apiClient])

  if (loading || error) {
    // TODO: render appropriate state
    return null
  }

  return <Avatar user={user} />
}
