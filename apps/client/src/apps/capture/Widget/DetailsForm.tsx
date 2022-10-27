import { Col } from 'jsxstyle'
import React from 'react'
import { Input } from '~/components/Input'
import { Label } from '~/components/Label'

interface Props {
  title: string
  description: string
  onTitleChange(title: string): void
  onDescriptionChange(description: string): void
}

export const DetailsForm: React.FC<Props> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}) => (
  <Col gap={20}>
    <Col gap={10}>
      <Label>Title</Label>
      <Input
        value={title}
        onChange={onTitleChange}
        size="large"
        autoFocus={true}
        placeholder="What is the bug?"
      />
    </Col>

    <Col gap={10}>
      <Label>Description</Label>
      <Input
        value={description}
        onChange={onDescriptionChange}
        size="medium"
        placeholder="Is there anything else that would be useful to know?"
        rows={12}
      />
    </Col>
  </Col>
)
