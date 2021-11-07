import React, { useEffect, useState } from 'react'
import { Grid } from 'jsxstyle'
import { Modal } from '@/components/Modal'
import { PlaybackErrorBoundary } from '@/components/PlaybackErrorBoundary'
import { PlaybackCanvas } from '@/components/PlaybackCanvas'
import { PlaybackControls } from '@/components/PlaybackControls'
import { createReplay, EMPTY_REPLAY, ReplayProvider, useRecording } from '@/libs/playback'
import { useView, View } from '../../view'
import { Header } from './Header'
import { Actions } from './Actions'

export const Preview: React.FC = () => {
  const [replay, setReplay] = useState(EMPTY_REPLAY)
  const { setView } = useView()
  const recording = useRecording()

  useEffect(() => {
    setReplay(createReplay(recording))
  }, [recording, setReplay])

  const handleDone = () => {
    setView(View.Confirm)
  }

  const handleCancel = () => {
    setView(View.Idle)
  }

  return (
    <ReplayProvider replay={replay}>
      <Modal width="80vw" minWidth={500} height="80vh">
        <PlaybackErrorBoundary>
          <Layout>
            <Header />
            <PlaybackCanvas />
            <PlaybackControls />
            <Actions onCancel={handleCancel} onDone={handleDone} />
          </Layout>
        </PlaybackErrorBoundary>
      </Modal>
    </ReplayProvider>
  )
}

const Layout: React.FC = ({ children }) => (
  <Grid
    gridTemplateAreas={`
      "header header"
      "canvas canvas"
      "controls actions"
    `}
    gridTemplateColumns="1fr auto"
    gridTemplateRows="50px 1fr 45px"
    height="100%"
  >{children}</Grid>
)
