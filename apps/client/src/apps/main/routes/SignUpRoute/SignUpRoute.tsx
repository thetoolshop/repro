import { User } from '@repro/domain'
import { and, fork } from 'fluture'
import { Block, Grid } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Card } from '~/components/Card'
import { colors } from '~/config/theme'
import { useApiClient } from '~/libs/api'
import { setSession } from '~/libs/auth/Session'
import { useBillingClient } from '~/libs/billing'
import { logger } from '@repro/logger'
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
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    billingClient.init()
  }, [billingClient])

  function onCreateAccount(values: CreateAccountValues) {
    const session = apiClient.auth.register(
      values.name,
      values.company,
      values.email,
      values.password
    )

    const user = apiClient.user.getMyUser()

    return fork<Error>(err => {
      setErrorMessage(err.message)
    })<User>(user => {
      setSession(user)
      navigate('/')
    })(session.pipe(and(user)))
  }

  function onSelectPlan(type: 'free' | 'team', vendorPlanId?: number) {
    logger.debug(type, vendorPlanId)
  }

  return (
    <Block width={780}>
      <Card>
        <Grid gridTemplateColumns="3fr 2fr" columnGap={30}>
          {errorMessage && (
            <Block
              gridColumn="1 / span 2"
              marginBottom={20}
              padding={10}
              fontSize={13}
              lineHeight={1.5}
              backgroundColor={colors.rose['100']}
              color={colors.rose['700']}
              borderRadius={4}
              borderColor={colors.rose['300']}
              borderStyle="solid"
              borderWidth={1}
            >
              {errorMessage}
            </Block>
          )}

          <SignUpForm onSubmit={onCreateAccount} />
          <PlanSelector onChange={onSelectPlan} />
        </Grid>
      </Card>
    </Block>
  )
}
