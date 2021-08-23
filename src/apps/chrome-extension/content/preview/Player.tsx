import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import {useSnapshot} from '@/libs/playback'

export const Player: React.FC = () => {
  const snapshot = useSnapshot()
  console.log(snapshot)

  return (
    <Block background={colors.blueGray['100']} />
  )
}
