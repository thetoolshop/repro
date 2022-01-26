import React, { MouseEvent } from 'react'
import { Block, Row } from 'jsxstyle'
import { colors } from '@/config/theme'

interface Props {
  width: string | number
  height: string | number
  minWidth?: string | number
  minHeight?: string | number
  onClose(): void
}

export const Modal: React.FC<Props> = ({
  children,
  width,
  height,
  minWidth,
  minHeight,
  onClose,
}) => (
  <Backdrop onClick={onClose}>
    <Container
      width={width}
      height={height}
      minWidth={minWidth}
      minHeight={minHeight}
    >
      {children}
    </Container>
  </Backdrop>
)

const Backdrop: React.FC<{ onClick(): void }> = ({ children, onClick }) => {
  const handleClick = (evt: MouseEvent<HTMLDivElement>) => {
    if (evt.target === evt.currentTarget) {
      onClick()
    }
  }

  return (
    <Row
      alignItems="center"
      justifyContent="center"
      background="rgba(0, 0, 0, 0.75)"
      position="fixed"
      top={0}
      left={0}
      bottom={0}
      right={0}
      props={{ onClick: handleClick }}
    >
      {children}
    </Row>
  )
}

type ContainerProps = Pick<Props, 'width' | 'height' | 'minWidth' | 'minHeight'>

const Container: React.FC<ContainerProps> = ({
  children,
  width,
  height,
  minWidth,
  minHeight,
}) => (
  <Block
    background={colors.white}
    boxShadow="0 8px 16px rgba(0, 0, 0, 0.25)"
    borderRadius={4}
    minHeight={minHeight}
    minWidth={minWidth}
    height={height}
    width={width}
    overflow="hidden"
  >
    {children}
  </Block>
)
