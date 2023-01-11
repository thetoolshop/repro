import { Block, Col, Row } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '~/components/Button'
import { Input } from '~/components/Input'
import { Label } from '~/components/Label'
import { ToggleGroup } from '~/components/ToggleGroup'
import { colors } from '~/config/theme'

enum Visibility {
  Public,
  Private,
}

interface FormState {
  title: string
  description: string
  isPublic: boolean
}

interface Props {
  onSubmit(data: FormState): void
}

export const DetailsForm: React.FC<Props> = ({ onSubmit }) => {
  const { handleSubmit, register, formState, setValue, watch } =
    useForm<FormState>({
      defaultValues: {
        title: '',
        description: '',
        isPublic: true,
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

        <Row gap={10} alignItems="center">
          <Label>Visibility</Label>
          <ToggleGroup
            options={[
              { label: 'Public', value: Visibility.Public },
              { label: 'Private', value: Visibility.Private },
            ]}
            selected={
              watch('isPublic') ? Visibility.Public : Visibility.Private
            }
            onChange={value =>
              setValue('isPublic', value === Visibility.Public)
            }
          />
        </Row>

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
