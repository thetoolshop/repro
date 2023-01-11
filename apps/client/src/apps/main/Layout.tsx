import { Block, Grid, Row } from 'jsxstyle'
import React from 'react'
import { Outlet } from 'react-router'
import { NavLink } from 'react-router-dom'
import { Logo } from '~/components/Logo'
import { colors } from '~/config/theme'
import { IfSession, UnlessSession } from '~/libs/auth/Session'

const navLinkStyle = {
  color: colors.white,
  fontSize: 15,
  textDecoration: 'none',
}

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

        <IfSession>
          <Row alignItems="center" marginLeft={30} gap={15}>
            <NavLink to="/recordings" style={navLinkStyle}>
              Recordings
            </NavLink>

            <NavLink to="/projects" style={navLinkStyle}>
              Projects
            </NavLink>
          </Row>
        </IfSession>

        <UnlessSession>
          <Row alignItems="center" gap={15} marginLeft="auto">
            <NavLink to="/account/login" style={navLinkStyle}>
              Log In
            </NavLink>

            <NavLink
              to="/account/signup"
              style={{
                ...navLinkStyle,
                padding: 10,
                fontWeight: 700,
                backgroundColor: colors.blue['500'],
                backgroundImage: `linear-gradient(to top right, ${colors.blue['600']}, ${colors.blue['500']})`,
                border: `1px solid ${colors.blue['800']}`,
                borderRadius: 4,
                boxShadow: `0 2px 4px ${colors.blue['800']}`,
              }}
            >
              Create New Account
            </NavLink>
          </Row>
        </UnlessSession>
      </Row>
    </Block>

    <Block marginTop={-60} padding={15}>
      <Outlet />
    </Block>
  </Grid>
)
