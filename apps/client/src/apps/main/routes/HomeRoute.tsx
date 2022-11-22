import { Project } from '@repro/domain'
import { fork } from 'fluture'
import React, { useEffect, useState } from 'react'
import { useApiClient } from '~/libs/api'
import { logger } from '~/libs/logger'

export const HomeRoute: React.FC = () => {
  const [projects, setProjects] = useState<Array<Project>>([])
  const apiClient = useApiClient()

  useEffect(() => {
    fork<Error>(logger.error)(logger.info)(apiClient.project.getAllProjects())
  }, [apiClient, setProjects])

  return null
}
