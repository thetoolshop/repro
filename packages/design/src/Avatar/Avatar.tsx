import { Block, Row } from 'jsxstyle'
import md5 from 'md5'
import React, { useMemo } from 'react'

interface Props {
  email: string
  name?: string
  mode?: 'full' | 'image-only' | 'text-only'
  size?: number
  color?: string
}

export const Avatar: React.FC<Props> = ({
  email,
  name = email,
  mode = 'full',
  size = 30,
  color = 'inherit',
}) => {
  const showImage = mode === 'full' || mode === 'image-only'
  const showText = mode === 'full' || mode === 'text-only'

  const hash = useMemo(() => {
    return md5(email.trim())
  }, [email])

  return (
    <Row alignItems="center" gap={10}>
      {showImage && (
        <Block
          overflow="hidden"
          borderRadius="99rem"
          width={size}
          height={size}
        >
          <img
            src={`https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`}
            alt={name}
          />
        </Block>
      )}

      {showText && (
        <Block fontSize={size / 2} color={color}>
          {name}
        </Block>
      )}
    </Row>
  )
}
