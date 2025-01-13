import { Logo, colors } from '@repro/design'
import { Block, Grid, Row } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'

export const FullWidthLayout: React.FC<PropsWithChildren> = ({ children }) => (
  <Grid
    height="100vh"
    gridTemplateRows="auto 1fr"
    backgroundColor={colors.white}
  >
    <Block
      padding={20}
      height={120}
      backgroundColor={colors.blue['500']}
      backgroundImage={`linear-gradient(to bottom right, ${colors.blue['900']}, ${colors.blue['700']})`}
    >
      <Row alignItems="center">
        <Logo size={30} inverted={true} />
      </Row>
    </Block>

    <Block marginTop={-60} padding={15}>
      {children}
    </Block>
  </Grid>
)
