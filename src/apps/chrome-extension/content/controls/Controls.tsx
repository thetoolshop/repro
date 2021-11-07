import { motion } from 'framer-motion'
import { Block, Row } from 'jsxstyle'
import { getStyleElement } from 'jsxstyle-utils'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { colors } from '@/config/theme'
import { setRecording } from '@/libs/playback'
import { View, useView } from '../../view'
import { Response, StartCommand, StopCommand } from '../types'

export const Controls: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false)
  const timer = useTimer(isStarted)
  const { setView } = useView()
  const [messageChannel, setMessageChannel] = useState<MessageChannel | null>(null)

  useEffect(() => {
    const styleElement = getStyleElement()

    if (styleElement) {
      styleElement.classList.add('repro-ignore')
    }

    const channel = new MessageChannel()

    const script = document.createElement('script')
    script.src = chrome.runtime.getURL('rc.js')
    script.addEventListener('load', () => {
      window.postMessage('repro:handshake', location.origin, [channel.port2])
      setMessageChannel(channel)
    })
    document.body.appendChild(script)

    return () => {
      setMessageChannel(null)
      script.remove()
    }
  }, [])

  useEffect(() => {
    function handleResponse(ev: MessageEvent<Response>) {
      const res = ev.data

      switch (res.name) {
        case 'recording':
          setRecording(res.payload)
          setView(View.Preview)
          break
      }
    }

    if (messageChannel) {
      messageChannel.port1.addEventListener('message', handleResponse)
      messageChannel.port1.start()
      messageChannel.port1.postMessage({
        name: 'start',
      } as StartCommand)
      setIsStarted(true)
    }

    return () => {
      if (messageChannel) {
        messageChannel.port1.removeEventListener('message', handleResponse)
      }
    }
  }, [messageChannel, setIsStarted])

  function handleStopRecording() {
    if (messageChannel) {
      messageChannel.port1.postMessage({
        name: 'stop',
      } as StopCommand)
      setIsStarted(false)
    }
  }

  return (
    <Container>
      <Logo size={20} />
      <Timer>
        <Light />
        <Block fontFamily="monospace">
          {formatTime(timer)}
        </Block>
      </Timer>
      <Button
        size="small"
        onClick={handleStopRecording}
      >End</Button>
    </Container>
  )
}

const useTimer = (isStarted: boolean) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const timer = isStarted
      ? setInterval(() => setValue(value => value + 1), 1000)
      : undefined
    return () => clearInterval(timer)
  }, [setValue, isStarted])

  return value
}

const formatTime = (time: number) => {
  const minutes = time / 60 | 0
  const seconds = time - minutes * 60
  return `${pad(minutes)}:${pad(seconds)}`
}

const pad = (value: number) => {
  if (value < 10) {
    return `0${value}`
  }

  return value.toString()
}

const Container: React.FC = ({ children }) => (
  <Row
    alignItems="center"
    background={colors.white}
    boxShadow="0 4px 4px rgba(0, 0, 0, 0.25)"
    color={colors.blueGray['700']}
    gap={20}
    left="50%"
    paddingH={10}
    paddingV={10}
    position="fixed"
    top={0}
    transform="translate(-50%)"
  >{children}</Row>
)

const Timer: React.FC = ({ children }) => (
  <Row alignItems="center" gap={5}>{children}</Row>
)

const Light: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    viewBox="0 0 14 14"
  >
    <circle
      cx={7}
      cy={7}
      r={6}
      fill="none"
      stroke={colors.pink['500']}
      strokeWidth={2}
    />

    <motion.circle
      cx={7}
      cy={7}
      r={3}
      fill={colors.pink['500']}

      animate={{
        opacity: [1, 0.25, 1],
      }}

      transition={{
        duration: 2,
        ease: 'linear',
        repeat: Infinity,
      }}
    />
  </svg>
)
