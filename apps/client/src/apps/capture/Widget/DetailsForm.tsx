import { Block, Col } from 'jsxstyle'
import React from 'react'
import { Input } from '~/components/Input'
import { colors } from '~/config/theme'

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
}) => {
  function preventKeyCapture(evt: React.KeyboardEvent<HTMLElement>) {
    evt.stopPropagation()
  }

  function handleDescriptionChange(
    evt: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    onDescriptionChange(evt.target.value)
  }

  return (
    <Col gap={10}>
      <Input
        value={title}
        onChange={onTitleChange}
        size="large"
        autoFocus={true}
        placeholder="Title"
      />

      <Block
        component="textarea"
        width="100%"
        padding={16}
        color={colors.slate['800']}
        backgroundColor={colors.slate['100']}
        focusBackgroundColor={colors.slate['200']}
        border="none"
        borderRadius={4}
        fontFamily="sans-serif"
        fontSize={13}
        lineHeight={1.25}
        resize="none"
        focusOutline="none"
        props={{
          placeholder: 'Write a description...',
          rows: 12,
          value: description,
          onChange: handleDescriptionChange,
          onKeyDown: preventKeyCapture,
          onKeyUp: preventKeyCapture,
          onKeyPress: preventKeyCapture,
        }}
      />
    </Col>
  )
}
