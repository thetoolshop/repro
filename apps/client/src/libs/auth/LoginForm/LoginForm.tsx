import { zodResolver } from '@hookform/resolvers/zod'
import { useApiClient } from '@repro/api-client'
import { Button, colors, Input } from '@repro/design'
import { User } from '@repro/domain'
import { isValidationError } from '@repro/validation'
import { and, fork } from 'fluture'
import { Block, Col } from 'jsxstyle'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

interface Props {
  onSuccess(user: User): void
  onFailure(error: Error): void
}

const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const resetFormSchema = z.object({
  email: z.string().email(),
})

type LoginFormState = z.infer<typeof loginFormSchema>
type ResetFormState = z.infer<typeof resetFormSchema>
type FormState = LoginFormState | ResetFormState

export const LoginForm: React.FC<Props> = ({ onSuccess, onFailure }) => {
  const [errorMessage, setErrorMessage] = useState('')
  const [showResetFlow, setShowResetFlow] = useState(false)
  const [showPostResetMessage, setShowPostResetMessage] = useState(false)
  const [supportPasswordReset] = useState(false)
  const apiClient = useApiClient()

  const { register, formState, handleSubmit } = useForm<FormState>({
    resolver: zodResolver(showResetFlow ? resetFormSchema : loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function onResetRequest(data: ResetFormState) {
    return fork<Error>(() => {
      setErrorMessage(
        'Unable to complete password reset request. Please try again'
      )
    })(() => {
      setShowPostResetMessage(true)
      setShowResetFlow(false)
    })(apiClient.auth.forgotPassword(data.email))
  }

  function onLogin(data: LoginFormState) {
    setShowPostResetMessage(false)

    const session = apiClient.auth.login(data.email, data.password)
    const user = apiClient.user.getMyUser()

    return fork<Error>(err => {
      if (isValidationError(err) || err.name === 'NotAuthenticatedError') {
        setErrorMessage('Incorrect email or password')
      } else {
        setErrorMessage('Unable to log in. Please try again')
      }

      onFailure(err)
    })(onSuccess)(session.pipe(and(user)))
  }

  function onSubmit(data: FormState) {
    if (showResetFlow) {
      onResetRequest(data as ResetFormState)
    } else {
      onLogin(data as LoginFormState)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Col gap={10}>
        <Block fontSize={15} fontWeight={700} color={colors.blue['700']}>
          {showResetFlow ? 'Reset Your Password' : 'Log In'}
        </Block>

        <Block
          paddingBottom={10}
          fontSize={13}
          lineHeight="1.5em"
          borderBottom={`1px solid ${colors.slate['200']}`}
          color={colors.slate['500']}
        >
          {showResetFlow
            ? 'Enter your email for password reset instructions'
            : 'Log in to your Repro account'}
        </Block>

        {supportPasswordReset && showPostResetMessage && (
          <Block
            alignSelf="stretch"
            padding={10}
            fontSize={13}
            lineHeight={1.5}
            backgroundColor={colors.blue['100']}
            color={colors.blue['700']}
            borderRadius={4}
            borderColor={colors.blue['300']}
            borderStyle="solid"
            borderWidth={1}
          >
            Please check your email for instructions to reset your password.
          </Block>
        )}

        {errorMessage && (
          <Block
            alignSelf="stretch"
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

        <Input
          autoFocus={true}
          placeholder="Email"
          {...register('email', { required: true })}
        />

        {!showResetFlow && (
          <Input
            type="password"
            placeholder="Password"
            {...register('password', { required: true })}
          />
        )}

        {supportPasswordReset && showResetFlow && (
          <Block>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setShowResetFlow(true)
                setShowPostResetMessage(false)
                setErrorMessage('')
              }}
            >
              Forgot password?
            </Button>
          </Block>
        )}

        <Button disabled={formState.isSubmitting} type="submit">
          {showResetFlow ? 'Send Reset Email' : 'Log In'}
        </Button>

        {supportPasswordReset && showResetFlow && (
          <Block alignSelf="center">
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setShowResetFlow(false)
                setShowPostResetMessage(false)
                setErrorMessage('')
              }}
            >
              Back to login
            </Button>
          </Block>
        )}
      </Col>
    </form>
  )
}
