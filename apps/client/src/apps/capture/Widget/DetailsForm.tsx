import { Block, Col, Row } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '~/components/Button'
import { Input } from '~/components/Input'
import { Label } from '~/components/Label'
import { colors } from '~/config/theme'

interface FormState {
  title: string
  description: string
}

interface Props {
  onSubmit(data: FormState): void
}

export const DetailsForm: React.FC<Props> = ({ onSubmit }) => {
  const { handleSubmit, register, formState } = useForm<FormState>({
    mode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Col gap={20}>
        <Col gap={10}>
          <Label>Title</Label>
          {formState.errors.title && <Error>Please enter a title</Error>}
          <Input
            {...register('title', { required: true })}
            autoFocus={true}
            context={formState.errors.title !== undefined ? 'error' : 'normal'}
            placeholder="What is the bug?"
            size="large"
          />
        </Col>

        <Col gap={10}>
          <Label optional>Description</Label>
          <Input
            {...register('description')}
            size="medium"
            placeholder="Is there anything else that would be useful to know?"
            rows={12}
          />
        </Col>

        <Row flexDirection="row-reverse">
          <Button type="submit" context="success" size="large">
            Create Bug Report
          </Button>
        </Row>
      </Col>
    </form>
  )
}

const Error: React.FC<PropsWithChildren> = ({ children }) => (
  <Block color={colors.rose['700']}>{children}</Block>
)
