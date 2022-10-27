import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'

interface Props {
  value: string
  onChange(value: string): void

  autoFocus?: boolean
  placeholder?: string
  rows?: number
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  type?: string
}

const sizes = {
  small: 6,
  medium: 8,
  large: 12,
  xlarge: 16,
}

const MINIMUM_FONT_SIZE = 12

export const Input: React.FC<Props> = ({
  value,
  onChange,

  type = 'text',
  size = 'medium',
  autoFocus = false,
  placeholder = '',
  rows = 1,
}) => {
  const fontSize = Math.max(sizes[size] * 1.5, MINIMUM_FONT_SIZE)

  function preventKeyCapture(evt: React.KeyboardEvent<HTMLElement>) {
    evt.stopPropagation()
  }

  function handleChange(
    evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    onChange(evt.target.value)
  }

  return (
    <Block
      component={rows > 1 ? 'textarea' : 'input'}
      paddingH={12}
      paddingV={12}
      width="100%"
      fontFamily="inherit"
      fontSize={fontSize}
      lineHeight={1.5}
      color={colors.slate['800']}
      backgroundColor={colors.slate['100']}
      focusBackgroundColor={colors.white}
      borderColor="transparent"
      focusBorderColor={colors.blue['500']}
      borderStyle="solid"
      borderWidth={1}
      borderRadius={4}
      focusOutline="none"
      focusBoxShadow="0 2px 4px rgba(0, 0, 0, 0.1)"
      props={{
        autoFocus,
        placeholder,
        rows: rows > 1 ? rows : undefined,
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
