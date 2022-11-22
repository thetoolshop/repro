import { User } from '@repro/domain'
import { Col, Row } from 'jsxstyle'
import React from 'react'
import { useNavigate } from 'react-router'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { colors } from '~/config/theme'
import { LoginForm } from '~/libs/auth'
import { logger } from '~/libs/logger'
import { useCurrentUser } from '../state'

export const LoginRoute: React.FC = () => {
  const navigate = useNavigate()
  const [, setCurrentUser] = useCurrentUser()

  function onSuccess(user: User) {
    setCurrentUser(user)
    navigate('/')
  }

  function onFailure(err: Error) {
    logger.debug(err)
  }

  function onRedirectToRegister() {
    navigate('/auth/register')
  }

  return (
    <Col width={320} alignItems="stretch" gap={10}>
      <Card>
        <LoginForm onSuccess={onSuccess} onFailure={onFailure} />
        <Row
          justifyContent="center"
          marginTop={20}
          paddingTop={10}
          borderTop={`1px solid ${colors.slate['200']}`}
        >
          <Button
            size="small"
            variant="text"
            context="info"
            onClick={onRedirectToRegister}
          >
            Not signed up? Create a new account
          </Button>
        </Row>
      </Card>
    </Col>
  )
}
