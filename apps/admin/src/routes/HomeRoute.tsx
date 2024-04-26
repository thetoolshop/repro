import { useApiClient } from '@repro/api-client'
import { RecordingInfo } from '@repro/domain'
import { useFuture } from '@repro/future-utils'
import { Block } from 'jsxstyle'
import React from 'react'
import { defaultEnv as env } from '~/config/env'

export const HomeRoute: React.FC = () => {
  const apiClient = useApiClient()

  const result = useFuture(
    () => apiClient.fetch<Array<RecordingInfo>>('/recordings'),
    [apiClient]
  )

  if (result.success) {
    return (
      <>
        {result.data.map(recording => (
          <Block fontSize={15} lineHeight={1.5}>
            <a
              href={`${env.REPRO_WORKSPACE_URL}/recordings/${recording.id}`}
              target="_blank"
            >
              {recording.title}
            </a>
          </Block>
        ))}
      </>
    )
  }

  return null
}
