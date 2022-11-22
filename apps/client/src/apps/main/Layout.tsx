import { Block, Grid, Row } from 'jsxstyle'
import React from 'react'
import { Outlet } from 'react-router'
import { NavLink } from 'react-router-dom'
import { Logo } from '~/components/Logo'
import { colors } from '~/config/theme'

export const Layout: React.FC = () => (
  <Grid
    height="100vh"
    gridTemplateRows="auto 1fr"
    backgroundColor={colors.white}
  >
    <Block
      padding={20}
      height={120}
      backgroundColor={colors.blue['800']}
      backgroundImage={`linear-gradient(to bottom right, ${colors.blue['900']}, ${colors.blue['700']})`}
    >
      <Row alignItems="center">
        <NavLink to="/">
          <Logo size={20} inverted={true} />
        </NavLink>

        <Row alignItems="center" marginLeft={30} gap={15}>
          <NavLink to="/recordings">
            <Block color={colors.white} fontSize={15}>
              Recordings
            </Block>
          </NavLink>

          <NavLink to="/recordings">
            <Block color={colors.white} fontSize={15}>
              Projects
            </Block>
          </NavLink>
        </Row>
      </Row>
    </Block>

    <Block marginTop={-75} padding={15}>
      <Outlet />
    </Block>
  </Grid>
)
