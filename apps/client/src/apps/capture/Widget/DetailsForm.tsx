import { Block, Col, Row } from 'jsxstyle'
import { Eye as PublicVisibilityIcon } from 'lucide-react'
import React, { PropsWithChildren } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '~/components/Button'
import { Input } from '~/components/Input'
import { Label } from '~/components/Label'
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

        <Col
          gap={10}
          padding={20}
          marginH={-20}
          backgroundColor={colors.blue['50']}
        >
          <Row alignItems="center" gap={5} fontSize={15} fontWeight={700}>
            <PublicVisibilityIcon size={16} />
            <Block>Visible to anyone with the recording URL</Block>
          </Row>

          <Block fontSize={13} color={colors.slate['700']}>
            Private recordings are available on the Team Plan (coming soon)
          </Block>

          <Block
            component="a"
            fontSize={13}
            color={colors.blue['700']}
            props={{ href: 'mailto:hi@repro.dev?subject=Repro Team Plan' }}
          >
            Get in touch to find out more
          </Block>
        </Col>

        <Row>
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
