import { Block } from 'jsxstyle'
import React, { useEffect } from 'react'
import { colors } from '@/config/theme'
import { Confirm } from './confirm/Confirm'
import { Controls } from './controls/Controls'
import { View, useView } from '../view'
import { Preview } from './preview/Preview'

const MAX_INT32 = 2 ** 31

interface Message {
  action: string
  value: any
}

export const App: React.FC = () => {
  const { view, setView } = useView()

  useEffect(() => {
    function onMessage(
      message: Message,
      _: chrome.runtime.MessageSender,
      sendResponse: (response: boolean) => void
    ) {
      switch (message.action) {
        case 'announce':
          sendResponse(true)
          break

        case 'setView':
          setView(message.value)
          sendResponse(true)
          break
      }
    }

    chrome.runtime.onMessage.addListener(onMessage)

    return () => {
      chrome.runtime.onMessage.removeListener(onMessage)
    }
  }, [setView])

  return (
    <Base>
      {view === View.Record && <Controls />}
      {view === View.Preview && <Preview />}
      {view === View.Confirm && <Confirm />}
    </Base>
  )
}

const Base: React.FC = ({ children }) => (
  <Block
    color={colors.blueGray['700']}
    fontFamily="sans-serif"
    fontSize={13}
    lineHeight="1em"
    position="relative"
    zIndex={MAX_INT32}
  >
    {children}
  </Block>
)
