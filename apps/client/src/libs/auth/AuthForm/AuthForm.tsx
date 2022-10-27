import { User } from '@repro/domain'
import { Block, Col } from 'jsxstyle'
import React, { Fragment, useState } from 'react'
import { isValidationError } from '~/../../../packages/validation/dist'
import { Button } from '~/components/Button'
import { colors } from '~/config/theme'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

interface Props {
  onSuccess(user: User): void
  onFailure(error: Error): void
}

export const AuthForm: React.FC<Props> = ({ onSuccess, onFailure }) => {
  const [view, setView] = useState<'login' | 'register'>('login')
  const [errorMessage, setErrorMessage] = useState('')

  function handleAuthFailure(error: Error) {
    if (isValidationError(error) || error.name === 'NotAuthenticatedError') {
      setErrorMessage('Invalid email or password')
      return
    }

    onFailure(error)
  }

  function handleAuthSuccess(user: User) {
    setErrorMessage('')
    onSuccess(user)
  }

  function showLoginForm() {
    setErrorMessage('')
    setView('login')
  }

  function showRegisterForm() {
    setErrorMessage('')
    setView('register')
  }

  return (
    <Col
      alignItems="stretch"
      gap={10}
      padding={20}
      backgroundColor={colors.white}
      borderRadius={4}
      boxShadow={`
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.1)
    `}
    >
      {view === 'login' && (
        <Fragment>
          <LoginForm
            onSuccess={handleAuthSuccess}
            onFailure={handleAuthFailure}
          />

          <Block alignSelf="center">
            <Button variant="text" size="small" onClick={showRegisterForm}>
              Create an account
            </Button>
          </Block>
        </Fragment>
      )}

      {view === 'register' && (
        <Fragment>
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onFailure={handleAuthFailure}
          />

          <Block alignSelf="center">
            <Button variant="text" size="small" onClick={showLoginForm}>
              Have an account? Log in
            </Button>
          </Block>
        </Fragment>
      )}
    </Col>
  )
}
