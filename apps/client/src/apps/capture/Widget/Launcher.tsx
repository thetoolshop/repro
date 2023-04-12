import { Button, Logo, colors } from '@repro/design'
import { Block, Grid, InlineCol, Row } from 'jsxstyle'
import React from 'react'
import { X as CloseIcon } from 'lucide-react'
import { MAX_INT32 } from '../constants'
import { useActive } from '../hooks'

interface Props {
  onClick(): void
}

export const Launcher: React.FC<Props> = ({ onClick }) => {
  const [active] = useActive()

  return (
    <InlineCol
      alignItems="center"
      backgroundColor={colors.white}
      borderRadius={2}
      boxShadow="0 0 16px rgba(0, 0, 0, 0.15)"
      height={84}
      isolation="isolate"
      justifyContent="center"
      transform="translate(20px, -20px)"
      width={130}
      zIndex={MAX_INT32}
    >
      <Grid alignSelf="stretch" marginH={10}>
        <Button variant={!active ? 'contained' : 'outlined'} onClick={onClick}>
          {!active ? 'Report A Bug' : <CloseIcon color={colors.blue['700']} />}
        </Button>
      </Grid>

      <Row
        component="a"
        alignItems="center"
        marginTop={10}
        gap={4}
        color={colors.slate['700']}
        textDecoration="none"
        props={{ href: 'https://repro.dev', target: '_blank' }}
      >
        <Block>Powered by</Block>
        <Logo size={16} />
      </Row>
    </InlineCol>
  )
}
