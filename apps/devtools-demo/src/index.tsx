import { Card, Logo, colors } from '@repro/design'
import { DevTools, EventHighlights } from '@repro/devtools'
import { applyResetStyles } from '@repro/theme'
import { Block, Grid, Row } from 'jsxstyle'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { RecordingLoader } from './RecordingLoader'

const rootSelector = '#root'
const rootElem = document.querySelector(rootSelector)
const rootStyleSheet = document.querySelector<HTMLStyleElement>('#root-styles')

if (rootStyleSheet) {
  applyResetStyles(rootSelector, rootStyleSheet)
}

if (rootElem) {
  const root = createRoot(rootElem)

  root.render(
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
        <RecordingLoader>
          <Grid
            gap={15}
            height="calc(100vh - 90px)"
            gridTemplateRows="100%"
            gridTemplateColumns="4fr 1fr"
          >
            <Card fullBleed height="100%">
              <Block height="100%" overflow="hidden" borderRadius={4}>
                <DevTools />
              </Block>
            </Card>

            <Card fullBleed>
              <Block
                paddingV={10}
                height="100%"
                overflow="hidden"
                backgroundColor={colors.white}
                borderRadius={4}
              >
                <EventHighlights />
              </Block>
            </Card>
          </Grid>
        </RecordingLoader>
      </Block>
    </Grid>
  )
}
