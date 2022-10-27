import { User } from '@repro/domain'
import { invalid, isValidationError, parseSchema } from '@repro/validation'
import { and, chain, fork } from 'fluture'
import { Block, Col } from 'jsxstyle'
import React, { Fragment, useState } from 'react'
import z from 'zod'
import { Button } from '~/components/Button'
import { Input } from '~/components/Input'
import { colors } from '~/config/theme'
import { useApiCaller } from '~/libs/messaging'

interface Props {
  onSuccess(user: User): void
  onFailure(error: Error): void
}

const formSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const LoginForm: React.FC<Props> = ({ onSuccess, onFailure }) => {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showResetFlow, setShowResetFlow] = useState(false)

  const callApi = useApiCaller()

  function handleSubmit() {
    setLoading(true)

    const validate = parseSchema(formSchema, { email, password }, invalid)

    const session = validate.pipe(
      chain(args => callApi('auth', 'login', [args.email, args.password]))
    )

    const user = callApi<User>('user', 'getMyUser')

    return fork<Error>(err => {
      setLoading(false)

      if (isValidationError(err) || err.name === 'NotAuthenticatedError') {
        setErrorMessage('Incorrect email or password')
      } else {
        setErrorMessage('Unable to log in. Please try again')
      }

      onFailure(err)
    })(onSuccess)(session.pipe(and(user)))
  }

  return (
    <Col gap={10}>
      <Block fontSize={15} fontWeight={700} color={colors.blue['700']}>
        Log In
      </Block>

      <Block
        paddingBottom={10}
        fontSize={13}
        lineHeight="1.5em"
        borderBottom={`1px solid ${colors.slate['100']}`}
        color={colors.slate['500']}
      >
        Log in to save and share your recording
      </Block>

      {errorMessage && (
        <Block
          alignSelf="stretch"
          padding={10}
          fontSize={13}
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
        value={email}
        onChange={setEmail}
        autoFocus={true}
        placeholder="Email"
      />

      {!showResetFlow && (
        <Fragment>
          <Input
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Password"
          />

          <Block>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowResetFlow(true)}
            >
              Forgot password?
            </Button>
          </Block>
        </Fragment>
      )}

      <Button context="success" disabled={loading} onClick={handleSubmit}>
        {showResetFlow ? 'Send Reset Email' : 'Log In'}
      </Button>

      {showResetFlow && (
        <Block alignSelf="center">
          <Button
            variant="text"
            size="small"
            onClick={() => setShowResetFlow(false)}
          >
            Back to login
          </Button>
        </Block>
      )}
    </Col>
  )
}
