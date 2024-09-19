import { RegisterForm } from '@repro/auth'
import { Card } from '@repro/design'
import { logger } from '@repro/logger'
import { Col } from 'jsxstyle'
import React, { useCallback } from 'react'

export const RegisterRoute: React.FC = () => {
  const onSuccess = useCallback(() => {
    logger.debug('registration successful')
  }, [])

  const onFailure = useCallback((error: Error) => {
    logger.debug('registration failed', error)
  }, [])

  return (
    <Col width={320} alignItems="stretch" gap={10}>
      <Card>
        <RegisterForm onSuccess={onSuccess} onFailure={onFailure} />
      </Card>
    </Col>
  )
}
