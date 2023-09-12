import { Annotation } from '@repro/domain'
import {
  EMPTY_PLAYBACK,
  PlaybackCanvas,
  PlaybackProvider,
  usePlayback,
} from '@repro/playback'
import React, { useEffect, useState } from 'react'

interface Props {
  time: number
  annotations: Annotation[]
  boundingBox: {
    top: number
    left: number
    bottom: number
    right: number
  }
}

export const AnnotationCanvas: React.FC<Props> = ({ time, boundingBox }) => {
  const playback = usePlayback()
  const [innerPlayback, setInnerPlayback] = useState(EMPTY_PLAYBACK)

  useEffect(() => {
    setInnerPlayback(playback.copy())
  }, [playback, setInnerPlayback])

  return (
    <PlaybackProvider playback={innerPlayback} startTime={time}>
      <PlaybackCanvas
        interactive={false}
        scaling="scale-to-fit"
        trackScroll={false}
        trackPointer={false}
      />
    </PlaybackProvider>
  )
}
