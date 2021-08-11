import { Grid } from 'jsxstyle'
import React, { useEffect } from 'react'
import { FixtureSource, init, NullSource, setReadyState, setSource, useReadyState, useSource } from '@/libs/playback'
import { Canvas } from './Canvas'
import { Controls } from './Controls'
import { Header } from './Header'
import { Inspector } from './Inspector'
import { PlaybackLoop } from './PlaybackLoop'
import { Sidebar } from './Sidebar'
import { ReadyState } from '@/libs/playback/state'
import { forkJoin } from 'rxjs'

export const App: React.FC = () => {
  const source = useSource()
  const readyState = useReadyState()

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
    setReadyState(ReadyState.Loading)

    const subscription = forkJoin([
      source.events(),
      source.metadata()
    ]).subscribe(([events, metadata]) => {
      init(events, metadata.duration)
      setReadyState(ReadyState.Ready)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [source])

  if (readyState === ReadyState.Loading) {
    // TODO loading view
    return <div>Loading...</div>
  }

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
    fontSize="1.3rem"
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
