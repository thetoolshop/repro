import React from 'react'
import { Grid } from 'jsxstyle'
import { Modal } from '@/components/Modal'
import { PlaybackCanvas } from '@/components/PlaybackCanvas'
import { PlaybackControls } from '@/components/PlaybackControls'
import { PlaybackLoop } from '@/components/PlaybackLoop'
import { useView, View } from '../../view'
import { Header } from './Header'
import { Actions } from './Actions'

export const Preview: React.FC = () => {
  const { setView } = useView()

  const handleDone = () => {
    setView(View.Confirm)
  }

  const handleCancel = () => {
    setView(View.Idle)
  }

  return (
    <Modal width="80vw" minWidth={500} height="80vh">
      <PlaybackLoop />
      <Layout>
        <Header />
        <PlaybackCanvas />
        <PlaybackControls />
        <Actions onCancel={handleCancel} onDone={handleDone} />
      </Layout>
    </Modal>
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
