import { Block, Col, Inline, Row } from 'jsxstyle'
import { ToggleLeft, ToggleRight } from 'lucide-react'
import React, { useState } from 'react'
import { colors } from '~/config/theme'
import { FreePlan } from './FreePlan'
import { TeamPlan } from './TeamPlan'

interface Props {
  onChange(type: 'free'): void
  onChange(type: 'team', vendorPlanId: number): void
}

export const PlanSelector: React.FC<Props> = () => {
  const [selectedPlan, setSelectedPlan] = useState<'team' | 'free'>('team')
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('year')
  const annual = billingPeriod === 'year'

  return (
    <Col gap={20}>
      <Row
        alignItems="center"
        gap={5}
        paddingV={5}
        paddingH={10}
        borderRadius={2}
        hoverBackgroundColor={colors.blue['50']}
        cursor="pointer"
        props={{
          onClick: () =>
            setBillingPeriod(billingPeriod =>
              billingPeriod === 'month' ? 'year' : 'month'
            ),
        }}
      >
        <Block color={annual ? colors.blue['700'] : colors.slate['300']}>
          {annual ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        </Block>
        <Block fontSize={13}>
          Billed annually <Inline color={colors.blue['700']}>(save 20%)</Inline>
        </Block>
      </Row>

      <TeamPlan
        includedSeats={5}
        billingPeriod={billingPeriod}
        pricePerSeatPerMonth={10}
        pricePerSeatPerYear={8}
        selected={selectedPlan === 'team'}
        onSelect={() => setSelectedPlan('team')}
      />

      <FreePlan
        includedSeats={3}
        uploadLimit={25}
        selected={selectedPlan === 'free'}
        onSelect={() => setSelectedPlan('free')}
      />
    </Col>
  )
}
