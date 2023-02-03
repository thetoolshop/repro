import { User } from '@repro/domain'
import { Block, Row } from 'jsxstyle'
import md5 from 'md5'
import React, { useMemo } from 'react'

interface Props {
  user: User
  mode?: 'full' | 'image-only' | 'text-only'
  size?: number
  color?: string
}

export const Avatar: React.FC<Props> = ({
  user,
  mode = 'full',
  size = 30,
  color = 'inherit',
}) => {
  const showImage = mode === 'full' || mode === 'image-only'
  const showText = mode === 'full' || mode === 'text-only'

  const hash = useMemo(() => {
    return md5(user.email.trim())
  }, [user])

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
            alt={user.name}
          />
        </Block>
      )}

      {showText && (
        <Block fontSize={size / 2} color={color}>
          {user.name}
        </Block>
      )}
    </Row>
  )
}
