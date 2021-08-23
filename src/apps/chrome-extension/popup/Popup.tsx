import React from 'react'
import { Video as VideoIcon } from 'react-feather'
import { Block, Grid, Row } from 'jsxstyle'
import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { colors } from '@/config/theme'
import { View } from '../view'

const WIDTH = 240
const HEIGHT = 160

const Container: React.FC = ({ children }) => (
  <Grid
    gridTemplateRows="40px 1fr"
    width={WIDTH}
    minHeight={HEIGHT}
  >{children}</Grid>
)

export const Popup: React.FC = () => {
  async function startRecording() {
    const activeTab = await getActiveTab()

    if (activeTab && activeTab.id) {
      const hasContentScript = await announce(activeTab.id)

      if (!hasContentScript) {
        await loadContentScript(activeTab.id)
      }

      await setView(activeTab.id, View.Record)
    }

    window.close()
  }

  return (
    <Container>
      <Row
        alignItems="center"
        justifyContent="center"
      >
        <Logo size={20} />
      </Row>

      <Row
        alignItems="center"
        justifyContent="center"
        background={colors.blueGray['100']}
        borderColor={colors.blueGray['300']}
        borderStyle="solid"
        borderWidth="1px 0"
      >
        <Button size="medium" onClick={startRecording}>
          <VideoIcon size={16} />
          <Block>Start Recording</Block>
        </Button>
      </Row>
    </Container>
  )
}

async function getActiveTab() {
  return new Promise<chrome.tabs.Tab | null> (resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      resolve(tabs[0] || null)
    })
  })
}

async function announce(tabId: number) {
  return new Promise<boolean>(resolve => {
    chrome.tabs.sendMessage(tabId, { action: 'announce' }, response => {
      resolve(response ? true : false)
    })
  })
}

async function loadContentScript(tabId: number) {
  return new Promise<void>(resolve => {
    chrome.scripting.executeScript({
      files: ['content.js'],
      target: { tabId },
    }, () => resolve())
  })
}

async function setView(tabId: number, view: View) {
  return new Promise<void>(resolve => {
    chrome.tabs.sendMessage(tabId, {
      action: 'setView',
      value: view,
    }, () => resolve())
  })
}
