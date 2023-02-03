import React from 'react'
import { Avatar } from '~/components/Avatar'
import { useApiClient } from '~/libs/api'
import { useFuture } from '~/utils/future'

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
