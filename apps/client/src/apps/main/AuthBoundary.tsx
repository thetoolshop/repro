import { User } from '@repro/domain'
import { fork } from 'fluture'
import { Loader as LoaderIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import * as FX from '~/components/FX'
import { useApiClient } from '~/libs/api'
import { useCurrentUser } from './state'

export const AuthBoundary: React.FC = () => {
  const apiClient = useApiClient()
  const navigate = useNavigate()
  const [, setCurrentUser] = useCurrentUser()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return apiClient.user.getMyUser().pipe(
      fork(() => {
        setCurrentUser(null)
        setLoading(false)
        navigate('/account/login')
      })<User>(user => {
        setCurrentUser(user)
        setLoading(false)
      })
    )
  }, [apiClient, navigate, setCurrentUser, setLoading])

  if (loading) {
    return (
      <FX.Spin>
        <LoaderIcon />
      </FX.Spin>
    )
  }

  return <Outlet />
}
