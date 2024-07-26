import React from 'react'
import { EventLogPane } from './EventLogPane'
import { InstantReplayPane } from './InstantReplayPane'
import { PlaybackPane } from './PlaybackPane'
import { useVisiblePane } from './hooks'
import { Pane } from './types'

export const VisiblePane: React.FC = () => {
  const [visiblePane] = useVisiblePane()

  switch (visiblePane) {
    case Pane.EventLog:
      return <EventLogPane />
    case Pane.Playback:
      return <PlaybackPane />
    case Pane.SaveRecording:
      return <InstantReplayPane />
    default:
      return null
  }
}
