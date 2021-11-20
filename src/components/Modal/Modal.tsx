import React from 'react'
import { Block, Row } from 'jsxstyle'
import { colors } from '@/config/theme'

interface Props {
  width: string | number
  height: string | number
  minWidth?: string | number
  minHeight?: string | number
}

export const Modal: React.FC<Props> = ({
  children,
  width,
  height,
  minWidth,
  minHeight,
}) => (
  <Backdrop>
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

const Backdrop: React.FC = ({ children }) => (
  <Row
    alignItems="center"
    justifyContent="center"
    background="rgba(0, 0, 0, 0.75)"
    position="fixed"
    top={0}
    left={0}
    bottom={0}
    right={0}
  >
    {children}
  </Row>
)

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
    minHeight={minHeight}
    minWidth={minWidth}
    height={height}
    width={width}
  >
    {children}
  </Block>
)
