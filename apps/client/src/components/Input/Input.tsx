import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

interface Props {
  value: string
  onChange(value: string): void

  type?: string
  size?: 'small' | 'medium' | 'large'
  autoFocus?: boolean
  placeholder?: string
}

const fontSize = {
  small: 11,
  medium: 13,
  large: 15,
}

export const Input: React.FC<Props> = ({
  value,
  onChange,

  type = 'text',
  size = 'medium',
  autoFocus = false,
  placeholder = '',
}) => {
  function preventKeyCapture(evt: React.KeyboardEvent<HTMLElement>) {
    evt.stopPropagation()
  }

  function handleChange(evt: React.ChangeEvent<HTMLInputElement>) {
    onChange(evt.target.value)
  }

  return (
    <Block
      component="input"
      paddingH={16}
      paddingV={8}
      width="100%"
      fontSize={fontSize[size]}
      lineHeight={1}
      color={colors.slate['800']}
      backgroundColor={colors.slate['100']}
      focusBackgroundColor={colors.slate['200']}
      border="none"
      borderRadius={4}
      focusOutline="none"
      props={{
        autoFocus,
        placeholder,
        type,
        value,
        onChange: handleChange,
        onKeyDown: preventKeyCapture,
        onKeyUp: preventKeyCapture,
        onKeyPress: preventKeyCapture,
      }}
    />
  )
}
