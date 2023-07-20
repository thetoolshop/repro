import { colors } from '@repro/design'
import { Col, Row } from 'jsxstyle'
import { Check as SelectedIcon } from 'lucide-react'
import React, { PropsWithChildren } from 'react'

interface Props {
  selected: boolean
  onSelect(): void
}

export const OptionBase: React.FC<PropsWithChildren<Props>> = ({
  children,
  selected,
  onSelect,
}) => (
  <Col
    position="relative"
    gap={5}
    paddingV={5}
    fontSize={13}
    color={colors.slate['800']}
    backgroundColor={selected ? colors.white : colors.slate['100']}
    hoverBackgroundColor={selected ? colors.white : colors.slate['50']}
    borderColor={selected ? colors.blue['500'] : 'transparent'}
    borderRadius={4}
    borderStyle="solid"
    borderWidth={1}
    boxShadow={selected ? `0 4px 8px ${colors.slate['200']}` : 'none'}
    cursor="pointer"
    props={{ onClick: onSelect }}
  >
    {selected && (
      <Row
        position="absolute"
        top={0}
        left={0}
        transform="translate(-15px, 15px)"
        width={30}
        height={30}
        alignItems="center"
        justifyContent="center"
        borderRadius="99rem"
        backgroundColor={colors.blue['700']}
        backgroundImage={`linear-gradient(to bottom right, ${colors.blue['600']}, ${colors.blue['800']})`}
        boxShadow={`0 2px 4px ${colors.slate['400']}`}
        visibility={selected ? 'visible' : 'hidden'}
      >
        <SelectedIcon width={20} color={colors.white} />
      </Row>
    )}

    {children}
  </Col>
)
