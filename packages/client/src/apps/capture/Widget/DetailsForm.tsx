import { Block, Col } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'

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

  function handleTitleChange(evt: React.ChangeEvent<HTMLInputElement>) {
    onTitleChange(evt.target.value)
  }

  function handleDescriptionChange(
    evt: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    onDescriptionChange(evt.target.value)
  }

  return (
    <Col gap={10} height="100%">
      <Block
        component="input"
        padding={8}
        width="100%"
        fontSize={16}
        fontWeight={700}
        lineHeight={1}
        color={colors.slate['700']}
        background={colors.white}
        boxShadow="inset 0 4px 8px rgba(0, 0, 0, 0.05)"
        border={`1px solid ${colors.slate['300']}`}
        borderRadius={2}
        focusOutline="none"
        props={{
          autoFocus: true,
          placeholder: 'Title',
          value: title,
          onChange: handleTitleChange,
          onKeyDown: preventKeyCapture,
          onKeyUp: preventKeyCapture,
          onKeyPress: preventKeyCapture,
        }}
      />

      <Block
        component="textarea"
        width="100%"
        padding={8}
        border={`1px solid ${colors.slate['300']}`}
        borderRadius={2}
        color={colors.slate['700']}
        background={colors.white}
        boxShadow="inset 0 4px 8px rgba(0, 0, 0, 0.05)"
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
