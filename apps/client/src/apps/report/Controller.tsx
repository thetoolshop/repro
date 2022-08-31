import { Grid } from 'jsxstyle'
import React, { useEffect } from 'react'
import { Outlet } from 'react-router'
import { Shortcuts } from 'shortcuts'
import { usePlayback } from '~/libs/playback'
import { usePicker } from './hooks'
import { Header } from './Header'

export const Controller: React.FC = () => {
  const playback = usePlayback()
  const [, setPicker] = usePicker()

  useEffect(() => {
    playback.seekToTime(0)
  }, [playback])

  useEffect(() => {
    const shortcuts = new Shortcuts()

    shortcuts.add({
      shortcut: 'CmdOrCtrl+Alt+Shift+C',
      handler: () => setPicker(picker => !picker),
    })

    return () => {
      shortcuts.reset()
    }
  }, [setPicker])

  return (
    <Grid height="100vh" gridTemplateRows="auto 1fr">
      <Header />
      <Outlet />
    </Grid>
  )
}
