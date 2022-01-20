import { Row } from 'jsxstyle'
import React, { useCallback } from 'react'
import { Crosshair } from 'react-feather'
import colors from 'tailwindcss/colors'
import { usePicker } from '../hooks'

export const Picker: React.FC = () => {
  const [picker, setPicker] = usePicker()

  const togglePicker = useCallback(() => {
    setPicker(picker => !picker)
  }, [setPicker])

  return (
    <Row alignItems="center" cursor="pointer" paddingH={10}>
      <Row
        alignItems="center"
        justifyContent="center"
        width={32}
        height={32}
        color={picker ? colors.pink['500'] : colors.blue['700']}
        backgroundColor={picker ? colors.pink['100'] : 'transparent'}
        borderRadius={4}
        props={{ onClick: togglePicker }}
      >
        <Crosshair size={16} />
      </Row>
    </Row>
  )
}
