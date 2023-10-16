import React from 'react'
import { EventLogPane } from './EventLogPane'
import { useVisiblePane } from './hooks'
import { PlaybackPane } from './PlaybackPane'
import { Pane } from './types'

export const VisiblePane: React.FC = () => {
  const [visiblePane] = useVisiblePane()

  switch (visiblePane) {
    case Pane.EventLog:
      return <EventLogPane />
    case Pane.Playback:
      return <PlaybackPane />
    default:
      return null
  }
}
