import { useApiClient } from '@repro/api-client'
import { FX } from '@repro/design'
import { User } from '@repro/domain'
import { fork } from 'fluture'
import { Grid } from 'jsxstyle'
import { Loader as LoaderIcon } from 'lucide-react'
import React, { Fragment, PropsWithChildren, useEffect, useState } from 'react'
import { useSetAtomValue } from '@repro/atom'
import { $session } from './state'

export const SessionProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const apiClient = useApiClient()
  const [loading, setLoading] = useState(true)
  const setSession = useSetAtomValue($session)

  useEffect(() => {
    return apiClient.user.getMyUser().pipe(
      fork(() => {
        setSession(null)
        setLoading(false)
      })<User>(user => {
        setSession(user)
        setLoading(false)
      })
    )
  }, [apiClient, setSession, setLoading])

  if (loading) {
    return (
      <Grid
        height="100vh"
        width="100vw"
        alignItems="center"
        justifyItems="center"
      >
        <FX.Spin>
          <LoaderIcon />
        </FX.Spin>
      </Grid>
    )
  }

  return <Fragment>{children}</Fragment>
}
