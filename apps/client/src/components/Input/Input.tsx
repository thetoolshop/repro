import { Block } from 'jsxstyle'
import React, { forwardRef } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'
import { colors } from '~/config/theme'

interface Props extends Omit<UseFormRegisterReturn, 'ref'> {
  autoFocus?: boolean
  context?: 'normal' | 'error'
  disabled?: boolean
  placeholder?: string
  rows?: number
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  type?: string
}

const sizes = {
  small: 8,
  medium: 10,
  large: 12,
  xlarge: 16,
}

const MINIMUM_FONT_SIZE = 12

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  (
    {
      autoFocus = false,
      context = 'normal',
      disabled = false,
      placeholder = '',
      rows = 1,
      size = 'medium',
      type = 'text',
      ...restProps
    },
    ref
  ) => {
    const fontSize = Math.max(sizes[size] * 1.5, MINIMUM_FONT_SIZE)

    function preventKeyCapture(evt: React.KeyboardEvent<HTMLElement>) {
      evt.stopPropagation()
    }

    return (
      <Block
        backgroundColor={colors.white}
        borderColor={colors.slate['300']}
        borderRadius={4}
        borderStyle="solid"
        borderWidth={1}
        boxShadow={`0 0.5px 1.5px ${colors.slate['300']}DA`}
      >
        <Block
          component={rows > 1 ? 'textarea' : 'input'}
          paddingH={12}
          paddingV={12}
          width="100%"
          fontFamily="inherit"
          fontSize={fontSize}
          lineHeight={1.5}
          color={colors.slate['800']}
          placeholderColor={colors.slate['500']}
          backgroundColor="transparent"
          borderColor={context === 'error' ? colors.rose['500'] : 'transparent'}
          focusBorderColor={
            context === 'error' ? colors.rose['500'] : colors.blue['500']
          }
          borderStyle="solid"
          borderWidth={1}
          borderRadius={4}
          focusOutline={`4px solid ${
            context === 'error' ? colors.rose['100'] : colors.blue['100']
          }`}
          resize="none"
          props={{
            autoFocus,
            disabled,
            placeholder,
            rows: rows > 1 ? rows : undefined,
            type,
            onKeyDown: preventKeyCapture,
            onKeyUp: preventKeyCapture,
            onKeyPress: preventKeyCapture,
            ref: ref as any,
            ...restProps,
          }}
        />
      </Block>
    )
  }
)
