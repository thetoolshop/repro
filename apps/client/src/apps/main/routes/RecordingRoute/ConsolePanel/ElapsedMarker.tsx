import { Block } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { Subscription } from 'rxjs'
import { colors } from '~/config/theme'
import { usePlayback } from '~/libs/playback'

interface Props {
  prevIndex: number
  nextIndex: number
}

export const ElapsedMarker: React.FC<Props> = ({ prevIndex, nextIndex }) => {
  const playback = usePlayback()
  const [active, setActive] = useState(false)

  useEffect(() => {
    const subscription = new Subscription()

    subscription.add(
      playback.$activeIndex.subscribe(activeIndex => {
        setActive(activeIndex >= prevIndex && activeIndex < nextIndex)
      })
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [nextIndex, prevIndex, playback, setActive])

  return (
    <Block
      position="relative"
      height={4}
      backgroundColor={active ? colors.blue['500'] : colors.slate['100']}
    />
  )
}
