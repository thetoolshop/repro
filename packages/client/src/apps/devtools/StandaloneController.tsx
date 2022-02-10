import { usePlayback } from '@/libs/playback'
import React, { useEffect } from 'react'
import { Outlet } from 'react-router'
import { Shortcuts } from 'shortcuts'
import { usePicker } from './hooks'

export const StandaloneController: React.FC = () => {
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

  return <Outlet />
}
