import React from 'react'
import { EventLogPane } from './EventLogPane'
import { PlaybackPane } from './PlaybackPane'
import { SaveRecordingPane } from './SaveRecordingPane'
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
      return <SaveRecordingPane />
    default:
      return null
  }
}
