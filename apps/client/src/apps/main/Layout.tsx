import { fork } from 'fluture'
import { Block, Grid, Row } from 'jsxstyle'
import React from 'react'
import { Outlet, useNavigate } from 'react-router'
import { NavLink } from 'react-router-dom'
import { Logo, colors } from '@repro/design'
import { useApiClient } from '~/libs/api'
import { IfSession, UnlessSession } from '~/libs/auth/Session'
import { logger } from '@repro/logger'
import { MyAvatar } from '~/libs/profile'

const navLinkStyle = {
  color: colors.white,
  fontSize: 15,
  textDecoration: 'none',
}

export const Layout: React.FC = () => {
  const navigate = useNavigate()
  const apiClient = useApiClient()

  function onSignOut() {
    apiClient.auth.logout().pipe(
      fork(logger.error)(() => {
        navigate('/account/login')
      })
    )
  }

  return (
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
          <NavLink to="/" style={{ textDecoration: 'none' }}>
            <Row alignItems="center" gap={5}>
              <Logo size={30} inverted={true} />

              <Block
                padding={5}
                backgroundColor={colors.blue['500']}
                color={colors.white}
                fontSize={13}
                fontWeight={700}
                textTransform="lowercase"
                borderRadius={4}
              >
                Beta
              </Block>
            </Row>
          </NavLink>

          <IfSession>
            <Row alignItems="center" marginLeft={30} gap={15}>
              <NavLink to="/" style={navLinkStyle}>
                All Recordings
              </NavLink>
            </Row>

            <Row
              alignItems="center"
              gap={15}
              marginLeft="auto"
              color={colors.white}
            >
              <MyAvatar />

              <Block
                padding={10}
                fontSize={15}
                fontWeight={700}
                color={colors.white}
                backgroundColor={colors.blue['500']}
                backgroundImage={`linear-gradient(to top right, ${colors.blue['600']}, ${colors.blue['500']})`}
                border={`1px solid ${colors.blue['800']}`}
                borderRadius={4}
                boxShadow={`0 2px 4px ${colors.blue['800']}`}
                cursor="pointer"
                props={{ onClick: onSignOut }}
              >
                Sign Out
              </Block>
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
}
