import React, { createContext, useContext, useEffect, useState } from 'react'

export enum PlaybackState {
  Playing,
  Paused,
}

interface PlaybackMeta {
  state: PlaybackState
  time: number
  duration: number
  pause(): void
  play(): void
  seek(time: number): void
}

const PlaybackContext = createContext<PlaybackMeta>({
  state: PlaybackState.Paused,
  time: 0,
  duration: 0,
  pause: () => undefined,
  play: () => undefined,
  seek: (_time: number) => undefined,
})

export const usePlayback = () => {
  return useContext(PlaybackContext)
}

interface Props {
  duration: number
}

export const PlaybackProvider: React.FC<Props> = ({ children, duration }) => {
  const [state, setState] = useState(PlaybackState.Paused)
  const [time, setTime] = useState(0)

  const pause = () => {
    setState(PlaybackState.Paused)
  }

  const play = () => {
    setState(PlaybackState.Playing)
  }

  const seek = (time: number) => {
    setTime(time)
  }

  useEffect(() => {
    let request: number

    if (state === PlaybackState.Playing) {
      let start: number | null = null

      const handleNextFrame = (timestamp: number) => {
        if (start === null) {
          start = timestamp
        }

        const delta = timestamp - start

        setTime(time => Math.min(duration, time + delta))
      }

      request = requestAnimationFrame(handleNextFrame)
    }

    return () => {
      cancelAnimationFrame(request)
    }
  }, [state, setTime])

  const value = {
    state,
    time,
    duration,
    pause,
    play,
    seek,
  }

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  )
}
