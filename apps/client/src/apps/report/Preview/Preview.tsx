import React, { useEffect } from 'react'
import { Grid } from 'jsxstyle'
import { PlaybackCanvas, usePlayback } from '@/libs/playback'
import { PlaybackControls } from './PlaybackControls'

export const Preview: React.FC = () => {
  const playback = usePlayback()

  useEffect(() => {
    playback.seekToTime(0)
    playback.play()
  }, [playback])

  return (
    <Grid
      height="100%"
      gridTemplateRows="minmax(0, 1fr) auto"
      overflow="hidden"
    >
      <PlaybackCanvas
        interactive={false}
        trackPointer={true}
        trackScroll={true}
        scaling="scale-to-fit"
      />
      <PlaybackControls />
    </Grid>
  )
}
