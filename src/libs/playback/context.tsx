import React, { useEffect } from 'react'
import { EMPTY_REPLAY, Replay } from './createReplay'

export const ReplayContext = React.createContext<Replay>(EMPTY_REPLAY)

interface Props {
  replay: Replay
}

export const ReplayProvider: React.FC<Props> = ({ children, replay }) => {
  useEffect(() => {
    replay.open()
    return () => replay.close()
  }, [replay])

  return (
    <ReplayContext.Provider value={replay}>{children}</ReplayContext.Provider>
  )
}
