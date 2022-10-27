import { InlineBlock, Row } from 'jsxstyle'
import React, { PropsWithChildren, useEffect } from 'react'
import { Loader as LoaderIcon } from 'lucide-react'
import { Alert } from '~/components/Alert'
import { Spin } from '~/components/FX'
import { useAtomValue } from '~/utils/state'
import { createSourcePlayback } from './createSourcePlayback'
import { Playback, Source } from './types'
import { Outlet } from 'react-router'

export const PlaybackContext = React.createContext<Playback | null>(null)

interface PlaybackProviderProps {
  playback: Playback | null
}

export const PlaybackProvider: React.FC<
  PropsWithChildren<PlaybackProviderProps>
> = ({ children, playback }) => {
  useEffect(() => {
    if (playback) {
      playback.open()
    }

    return () => {
      if (playback) {
        playback.close()
      }
    }
  }, [playback])

  return (
    <PlaybackContext.Provider value={playback}>
      {children}
    </PlaybackContext.Provider>
  )
}

interface PlaybackFromSourceProviderProps {
  source: Source
}

export const PlaybackFromSourceProvider: React.FC<
  PropsWithChildren<PlaybackFromSourceProviderProps>
> = ({ source }) => {
  const readyState = useAtomValue(source.$readyState)
  const events = useAtomValue(source.$events)

  if (readyState === 'waiting') {
    return (
      <Row height="100vh" alignItems="center" justifyContent="center">
        <InlineBlock>
          <Alert
            type="info"
            icon={
              <Spin height={24}>
                <LoaderIcon size={24} />
              </Spin>
            }
          >
            Loading recording
          </Alert>
        </InlineBlock>
      </Row>
    )
  }

  if (readyState === 'failed') {
    return <Alert type="danger">Could not load recording</Alert>
  }

  return (
    <PlaybackProvider playback={createSourcePlayback(events)}>
      <Outlet />
    </PlaybackProvider>
  )
}
