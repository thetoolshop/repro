import { Row } from 'jsxstyle'
import React from 'react'
import { CheckCircle, Circle } from 'react-feather'
import { Button } from '../Button'

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
      <Button
        key={value}
        context="neutral"
        variant={selected === value ? 'contained' : 'outlined'}
        onClick={() => onChange(value)}
      >
        {selected === value ? <CheckCircle size={16} /> : <Circle size={16} />}
        {label}
      </Button>
    ))}
  </Row>
)
