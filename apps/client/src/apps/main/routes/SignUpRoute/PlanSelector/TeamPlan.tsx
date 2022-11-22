import { Block, Col, Grid, Row } from 'jsxstyle'
import { Check as CheckIcon } from 'lucide-react'
import React from 'react'
import { colors } from '~/config/theme'
import { OptionBase } from './OptionBase'

interface Props {
  includedSeats: number
  pricePerSeatPerMonth: number
  pricePerSeatPerYear: number
  billingPeriod: 'month' | 'year'
  selected: boolean
  onSelect(): void
}

export const TeamPlan: React.FC<Props> = ({
  includedSeats,
  pricePerSeatPerMonth,
  pricePerSeatPerYear,
  billingPeriod,
  selected,
  onSelect,
}) => (
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
          <Block fontSize={15} fontWeight={700}>
            $
            {(billingPeriod === 'month'
              ? pricePerSeatPerMonth
              : pricePerSeatPerYear) * includedSeats}{' '}
            per month
          </Block>

          <Block color={colors.slate['500']}>
            {billingPeriod === 'month' ? 'Paid monthly' : 'Paid annually'}
          </Block>
        </Col>
      </Block>

      {billingPeriod === 'year' && (
        <Block
          paddingV={10}
          paddingH={10}
          backgroundColor={colors.slate['500']}
          color={colors.white}
          fontSize={15}
          borderRadius={4}
        >
          -20%
        </Block>
      )}
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
      borderWidth="1px 0 0"
    >
      <CheckIcon size={16} />
      <Block>Unlimited recordings</Block>

      <CheckIcon size={16} />
      <Block>Secure team workspace</Block>

      <CheckIcon size={16} />
      <Block>{includedSeats} team members included</Block>
      <Block gridColumn="2 / span 1" color={colors.blue['700']}>
        Add more for $
        {billingPeriod === 'year' ? pricePerSeatPerYear : pricePerSeatPerMonth}
        /month per seat
      </Block>

      <CheckIcon size={16} />
      <Block>Repro developer tools</Block>

      <CheckIcon size={16} />
      <Block>Early access to new features</Block>
    </Grid>
  </OptionBase>
)
