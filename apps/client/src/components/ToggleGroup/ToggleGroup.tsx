import { Block, Row } from 'jsxstyle'
import React from 'react'
import { CheckCircle, Circle } from 'react-feather'
import { colors } from '~/config/theme'

interface Props {
  options: Array<{
    value: number
    label: string
  }>
  selected: number
  onChange(selected: number): void
}

export const ToggleGroup: React.FC<Props> = ({
  options,
  selected,
  onChange,
}) => (
  <Row gap={10}>
    {options.map(({ value, label }) => (
      <Toggle
        key={value}
        active={selected === value}
        label={label}
        onClick={() => onChange(value)}
      />
    ))}
  </Row>
)

interface ToggleProps {
  active: boolean
  label: string
  onClick(): void
}

const Toggle: React.FC<ToggleProps> = ({ active, label, onClick }) => (
  <Row
    alignItems="center"
    cursor="pointer"
    gap={15}
    padding={15}
    fontSize={13}
    color={active ? colors.blue['700'] : colors.slate['800']}
    backgroundColor={active ? colors.white : colors.slate['100']}
    borderColor={active ? colors.blue['500'] : 'transparent'}
    borderWidth={1}
    borderStyle="solid"
    borderRadius={4}
    boxShadow={active ? `0 4px 8px ${colors.slate['200']}` : null}
    hoverBackgroundColor={active ? colors.white : colors.slate['200']}
    transition="all linear 100ms"
    props={{ onClick }}
  >
    <Block color={colors.blue['700']}>
      {active ? <CheckCircle size={16} /> : <Circle size={16} />}
    </Block>

    <Block fontSize={13}>{label}</Block>
  </Row>
)
