import { Logo, colors } from '@repro/design'
import { Block, InlineBlock, Row } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import { useActive } from '../hooks'

interface Props {
  size?: 'compact' | 'normal' | 'full-screen'
  title?: string
}

export const WidgetContainer: React.FC<PropsWithChildren<Props>> = ({
  children,
  title,
  size = 'normal',
}) => {
  const [active] = useActive()

  if (!active) {
    return null
  }

  return (
    <Block
      position="absolute"
      top={0}
      left={0}
      height={size === 'full-screen' ? 'calc(100vh - 130px)' : 'auto'}
      width={size === 'full-screen' ? 'calc(100vw - 140px)' : 'auto'}
      transform="translate(20px, calc(-100% - 30px))"
      backgroundColor={colors.white}
      boxShadow="0 0 16px rgba(0, 0, 0, 0.15)"
      borderRadius={2}
      overflow="hidden"
    >
      {size !== 'compact' && (
        <Block
          padding={20}
          height={120}
          backgroundColor={colors.blue['800']}
          backgroundImage={`linear-gradient(to bottom right, ${colors.blue['900']}, ${colors.blue['700']})`}
        >
          <Row alignItems="center" gap={10}>
            <Logo size={20} inverted={true} />

            {title && (
              <InlineBlock color={colors.white} fontSize={16}>
                {title}
              </InlineBlock>
            )}
          </Row>
        </Block>
      )}

      <Block
        marginTop={size !== 'compact' ? -75 : 'auto'}
        padding={15}
        height="calc(100% - 45px)"
      >
        {children}
      </Block>
    </Block>
  )
}
