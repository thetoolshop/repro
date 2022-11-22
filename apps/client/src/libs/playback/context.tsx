import React, { PropsWithChildren, useEffect, useState } from 'react'
import { useAtomValue } from '~/utils/state'
import { createSourcePlayback, EMPTY_PLAYBACK } from './createSourcePlayback'
import { Playback, Source } from './types'

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
      playback.seekToTime(0)
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
> = ({ children, source }) => {
  const events = useAtomValue(source.$events)
  const [playback, setPlayback] = useState(EMPTY_PLAYBACK)

  useEffect(() => {
    setPlayback(createSourcePlayback(events))
  }, [events, setPlayback])

  return <PlaybackProvider playback={playback}>{children}</PlaybackProvider>
}
