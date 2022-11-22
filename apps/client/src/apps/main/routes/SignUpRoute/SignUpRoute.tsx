import { Block, Grid } from 'jsxstyle'
import React, { useEffect } from 'react'
import { Card } from '~/components/Card'
import { useApiClient } from '~/libs/api'
import { useBillingClient } from '~/libs/billing'
import { logger } from '~/libs/logger'
import { PlanSelector } from './PlanSelector'
import { SignUpForm } from './SignUpForm'

interface CreateAccountValues {
  name: string
  email: string
  company: string
  password: string
}

export const SignUpRoute: React.FC = () => {
  const apiClient = useApiClient()
  const billingClient = useBillingClient()

  useEffect(() => {
    billingClient.init()
  }, [billingClient])

  function onCreateAccount(values: CreateAccountValues) {
    logger.debug(values)
  }

  function onSelectPlan(type: 'free' | 'team', vendorPlanId?: number) {
    logger.debug(type, vendorPlanId)
  }

  return (
    <Block width={780}>
      <Card>
        <Grid gridTemplateColumns="3fr 2fr" columnGap={30}>
          <SignUpForm onSubmit={onCreateAccount} />
          <PlanSelector onChange={onSelectPlan} />
        </Grid>
      </Card>
    </Block>
  )
}
