import React, { useEffect } from 'react'
import { Grid } from 'jsxstyle'
import { PlaybackCanvas, usePlayback } from '@/libs/playback'
import { Header } from './Header'

export const Preview: React.FC = () => {
  const playback = usePlayback()

  useEffect(() => {
    playback.seekToTime(0)
    playback.play()
  }, [playback])

  return (
    <Grid height="100vh" gridTemplateRows="auto 1fr">
      <Header />
      <PlaybackCanvas interactive={false} scaling="scale-to-fit" />
    </Grid>
  )
}
