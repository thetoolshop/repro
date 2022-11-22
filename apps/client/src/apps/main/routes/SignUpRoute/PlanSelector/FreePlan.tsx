import { Block, Grid } from 'jsxstyle'
import { Check as CheckIcon } from 'lucide-react'
import React from 'react'
import { colors } from '~/config/theme'
import { OptionBase } from './OptionBase'

interface Props {
  includedSeats: number
  uploadLimit: number
  selected: boolean
  onSelect(): void
}

export const FreePlan: React.FC<Props> = ({
  includedSeats,
  uploadLimit,
  selected,
  onSelect,
}) => (
  <OptionBase selected={selected} onSelect={onSelect}>
    <Block paddingV={10} paddingH={25}>
      <Block
        color={selected ? colors.blue['700'] : colors.slate['700']}
        fontSize={15}
        fontWeight={700}
        lineHeight={1}
      >
        Starter Plan
      </Block>

      <Block marginTop={10} color={colors.slate['500']}>
        Free forever
      </Block>
    </Block>

    <Grid
      alignItems="center"
      gridTemplateColumns="20px 1fr"
      rowGap={10}
      paddingH={25}
      paddingV={20}
      backgroundColor={selected ? colors.blue['100'] : 'transparent'}
      borderColor={selected ? 'transparent' : colors.slate['300']}
      borderStyle="solid"
      borderWidth="1px 0 0"
    >
      <CheckIcon size={16} />
      <Block>{uploadLimit} recordings per month</Block>

      <CheckIcon size={16} />
      <Block>{includedSeats} team members included</Block>
      <Block gridColumn="2 / span 1" color={colors.blue['700']}>
        Upgrade for more
      </Block>
    </Grid>
  </OptionBase>
)
