import { Block, Col, Grid, InlineBlock, Row } from 'jsxstyle'
import { Check as CheckIcon } from 'lucide-react'
import React from 'react'
import { Button } from '~/components/Button'
import { colors } from '~/config/theme'
import { OptionBase } from './OptionBase'

interface Props {
  selected: boolean
  onSelect(): void
}

export const TeamPlan: React.FC<Props> = ({ selected, onSelect }) => (
  <OptionBase selected={selected} onSelect={onSelect}>
    <Row
      paddingV={10}
      paddingH={25}
      alignItems="center"
      justifyContent="space-between"
    >
      <Block>
        <Block
          color={selected ? colors.blue['700'] : colors.slate['700']}
          fontSize={18}
          fontWeight={700}
          lineHeight={1}
        >
          Team Plan
        </Block>

        <Col marginTop={10} gap={10}>
          <Block fontSize={13} color={colors.slate['700']}>
            Coming soon
          </Block>
        </Col>
      </Block>
    </Row>

    <Grid
      alignItems="center"
      gridTemplateColumns="20px 1fr"
      rowGap={10}
      paddingH={25}
      paddingV={20}
      backgroundColor={selected ? colors.blue['100'] : 'transparent'}
      borderColor={selected ? 'transparent' : colors.slate['300']}
      borderStyle="solid"
      borderWidth="1px 0"
    >
      <CheckIcon size={16} />
      <Block>Unlimited public & private recordings</Block>

      <CheckIcon size={16} />
      <Block>Unlimited projects</Block>

      <CheckIcon size={16} />
      <Block>Repro DevTools</Block>

      <CheckIcon size={16} />
      <Block>Secure team workspace</Block>

      <CheckIcon size={16} />
      <Block>Connect to integrations</Block>

      <CheckIcon size={16} />
      <Block>Early access to new features</Block>
    </Grid>

    <Block paddingV={10} paddingH={20}>
      <InlineBlock
        component="a"
        textDecoration="none"
        props={{ href: 'mailto:hi@repro.dev?subject=Repro Team Plan' }}
      >
        <Button context="neutral" size="small">
          Get In Touch
        </Button>
      </InlineBlock>
    </Block>
  </OptionBase>
)
