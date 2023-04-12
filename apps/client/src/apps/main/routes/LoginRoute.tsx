import { User } from '@repro/domain'
import { Col, Row } from 'jsxstyle'
import React from 'react'
import { useNavigate } from 'react-router'
import { Button, Card, colors } from '@repro/design'
import { LoginForm } from '~/libs/auth'
import { setSession } from '~/libs/auth/Session'
import { logger } from '@repro/logger'

export const LoginRoute: React.FC = () => {
  const navigate = useNavigate()

  function onSuccess(user: User) {
    setSession(user)
    navigate('/')
  }

  function onFailure(err: Error) {
    setSession(null)
    logger.debug(err)
  }

  function onRedirectToRegister() {
    navigate('/account/signup')
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
