import { colors, Logo } from '@repro/design'
import { Block, Grid, Row } from 'jsxstyle'
import React from 'react'
import { Outlet } from 'react-router'
import { NavLink } from 'react-router-dom'

export const Layout: React.FC = () => {
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
        </Row>
      </Block>

      <Block marginTop={-60} padding={15}>
        <Outlet />
      </Block>
    </Grid>
  )
}
