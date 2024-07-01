import { colors } from '@repro/design'
import { usePlayback } from '@repro/playback'
import { Block } from 'jsxstyle'
import React from 'react'

export const SaveRecordingPane: React.FC = () => {
  const playback = usePlayback()

  return (
    <Block
      position="absolute"
      bottom={60}
      right={20}
      background={colors.slate['100']}
      borderColor={colors.slate['700']}
      borderStyle="solid"
      borderWidth="3px 1px 1px"
    />
  )
}
