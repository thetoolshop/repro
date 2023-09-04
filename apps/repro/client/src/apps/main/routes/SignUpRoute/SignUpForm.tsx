import { zodResolver } from '@hookform/resolvers/zod'
import { Button, colors, Input, Label } from '@repro/design'
import { Block, Col } from 'jsxstyle'
import { Rocket as SubmitIcon } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

const formSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    company: z.string(),
    password: z.string().min(1),
    confirmedPassword: z.string(),
  })
  .superRefine(({ password, confirmedPassword }, ctx) => {
    if (password !== confirmedPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmedPassword'],
        message: 'Passwords do not match',
      })
    }
  })

type FormValues = z.infer<typeof formSchema>

interface Props {
  onSubmit(values: FormValues): void
}

export const SignUpForm: React.FC<Props> = ({ onSubmit }) => {
  const { register, formState, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      password: '',
      confirmedPassword: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Col
        gap={20}
        paddingRight={30}
        borderRight={`1px solid ${colors.slate['200']}`}
      >
        <Col gap={10}>
          <Block fontSize={18} fontWeight={700} color={colors.blue['700']}>
            Create a new account
          </Block>
          <Block fontSize={13} color={colors.slate['500']}>
            Sign up and create your first recording today!
          </Block>
        </Col>

        <Col gap={10}>
          <Label>Name</Label>
          <Input
            autoFocus={true}
            context={formState.errors.name ? 'error' : 'normal'}
            {...register('name', { required: true })}
          />
        </Col>

        <Col gap={10}>
          <Label>Email Address</Label>
          <Input
            context={formState.errors.email ? 'error' : 'normal'}
            {...register('email', { required: true })}
          />
        </Col>

        <Col gap={10}>
          <Label optional>Company</Label>
          <Input
            context={formState.errors.company ? 'error' : 'normal'}
            {...register('company')}
          />
        </Col>

        <Col gap={10}>
          <Label>Password</Label>
          <Input
            type="password"
            context={formState.errors.password ? 'error' : 'normal'}
            {...register('password', { required: true })}
          />
        </Col>

        <Col gap={10}>
          <Label>Confirm Password</Label>
          <Input
            type="password"
            context={formState.errors.confirmedPassword ? 'error' : 'normal'}
            {...register('confirmedPassword', { required: true })}
          />
          {formState.errors.confirmedPassword && (
            <Block color={colors.rose['700']} fontSize={13}>
              {formState.errors.confirmedPassword.message}
            </Block>
          )}
        </Col>

        <Button size="large" type="submit">
          <SubmitIcon size={15} />
          <Block>Get Started</Block>
        </Button>
      </Col>
    </form>
  )
}
