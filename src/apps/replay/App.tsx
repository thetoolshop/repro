import { Grid } from 'jsxstyle'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Canvas } from './Canvas'
import { Controls } from './Controls'
import { Header } from './Header'
import { Inspector } from './Inspector'
import { Menu } from './Menu'
import { Sidebar } from './Sidebar'

export const App: React.FC = () => (
  <BrowserRouter>
    <Container>
      <Body>
        <Menu />
        <Sidebar />
        <Canvas />
        <Inspector />
      </Body>

      <Header />
      <Controls />
    </Container>
  </BrowserRouter>
)

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
      "menu sidebar canvas"
      "menu sidebar inspector"
    `}
    gridTemplateColumns="40px auto 1fr"
    gridTemplateRows="1fr auto"
  >{children}</Grid>
)
