import { Block, Col, Grid } from 'jsxstyle'
import React from 'react'
import { Outlet } from 'react-router'
import { Logo } from '~/components/Logo'
import { colors } from '~/config/theme'

export const AuthLayout: React.FC = () => (
  <Grid
    height="100vh"
    alignItems="center"
    justifyContent="center"
    gridAutoRows="auto"
    backgroundColor={colors.slate['200']}
    backgroundImage={`linear-gradient(to top right, ${colors.slate['200']}, ${colors.slate['50']})`}
  >
    <Col alignItems="flex-start" gap={20}>
      <Block paddingH={10}>
        <Logo size={24} />
      </Block>

      <Outlet />
    </Col>
  </Grid>
)
