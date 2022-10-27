import { User } from '@repro/domain'
import { fork } from 'fluture'
import { Block, Col } from 'jsxstyle'
import React, { useState } from 'react'
import { Button } from '~/components/Button'
import { Input } from '~/components/Input'
import { colors } from '~/config/theme'
import { useApiCaller } from '~/libs/messaging'

interface Props {
  onSuccess(user: User): void
  onFailure(error: Error): void
  invitationToken?: string
}

export const RegisterForm: React.FC<Props> = ({ onSuccess, onFailure }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmedPassword, setConfirmedPassword] = useState('')

  const callApi = useApiCaller()

  function handleRegister() {
    const user = callApi<User>('auth', 'register', [
      email,
      password,
      confirmedPassword,
    ])

    return user.pipe(fork(onFailure)(onSuccess))
  }

  return (
    <Col gap={10}>
      <Block fontSize={15} fontWeight={700} color={colors.blue['700']}>
        Create New Account
      </Block>

      <Block
        paddingBottom={10}
        fontSize={13}
        lineHeight="1.5em"
        borderBottom={`1px solid ${colors.slate['100']}`}
        color={colors.slate['500']}
      >
        Sign up for a free account to save and share your recording
      </Block>

      <Input
        value={name}
        onChange={setName}
        autoFocus={true}
        placeholder="Name"
      />

      <Input value={email} onChange={setEmail} placeholder="Email" />

      <Input
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Password"
      />

      <Input
        type="password"
        value={confirmedPassword}
        onChange={setConfirmedPassword}
        placeholder="Confirm Password"
      />

      <Button context="success" onClick={handleRegister}>
        Create Account
      </Button>
    </Col>
  )
}
