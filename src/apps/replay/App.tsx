import { Grid } from 'jsxstyle'
import React, { useEffect } from 'react'
import { FixtureSource, NullSource, setDuration, setSource, useSource } from '@/libs/playback'
import { Canvas } from './Canvas'
import { Controls } from './Controls'
import { Header } from './Header'
import { Inspector } from './Inspector'
import { PlaybackLoop } from './PlaybackLoop'
import { Sidebar } from './Sidebar'

export const App: React.FC = () => {
  const source = useSource()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const name = params.get('fixture')

    setSource(
      name !== null
        ? new FixtureSource(name)
        : new NullSource()
    )
  }, [])

  useEffect(() => {
    source.metadata()
      .then(({ duration }) => setDuration(duration))
  }, [source])

  return (
    <Container>
      <PlaybackLoop />

      <Body>
        <Sidebar />
        <Canvas />
        <Inspector />
      </Body>

      <Header />
      <Controls />
    </Container>
  )
}

const Container: React.FC = ({ children }) => (
  <Grid
    gridTemplateAreas={`
      "header"
      "body"
      "controls"
    `}
    gridTemplateRows="50px 1fr 45px"
    height="100vh"
    overflow="hidden"
  >{children}</Grid>
)

const Body: React.FC = ({ children }) => (
  <Grid
    gridArea="body"
    gridTemplateAreas={`
      "sidebar canvas"
      "sidebar inspector"
    `}
    gridTemplateColumns="auto 1fr"
    gridTemplateRows="1fr auto"
  >{children}</Grid>
)
