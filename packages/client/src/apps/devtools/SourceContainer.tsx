import React, { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router'
import {
  createHttpSource,
  createNullSource,
  PlaybackFromSourceProvider,
} from '@/libs/playback'

interface Props {
  baseUrl: string
}

export const SourceContainer: React.FC<Props> = ({ baseUrl }) => {
  const params = useParams()
  const [source, setSource] = useState(createNullSource())

  useEffect(() => {
    if (params.sourceId) {
      setSource(createHttpSource(`${baseUrl}/${params.sourceId}.repro`))
    }
  }, [params.sourceId, baseUrl, setSource])

  return (
    <PlaybackFromSourceProvider source={source}>
      <Outlet />
    </PlaybackFromSourceProvider>
  )
}
