import { Col } from 'jsxstyle'
import React, { useState } from 'react'
import { FreePlan } from './FreePlan'
import { TeamPlan } from './TeamPlan'

interface Props {
  onChange(type: 'free'): void
  onChange(type: 'team', vendorPlanId: number): void
}

export const PlanSelector: React.FC<Props> = () => {
  const [selectedPlan] = useState<'team' | 'free'>('free')

  return (
    <Col gap={20}>
      <TeamPlan selected={selectedPlan === 'team'} onSelect={() => {}} />
      <FreePlan selected={selectedPlan === 'free'} onSelect={() => {}} />
    </Col>
  )
}
