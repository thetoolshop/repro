import React, { useEffect } from 'react'
import { Playback } from './types'

export const PlaybackContext = React.createContext<Playback | null>(null)

interface Props {
  playback: Playback | null
}

export const PlaybackProvider: React.FC<Props> = ({ children, playback }) => {
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
