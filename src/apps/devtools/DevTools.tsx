import { Block, Grid } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { DragHandle } from '@/components/DragHandle'
import { colors } from '@/config/theme'
import { useRecordingStream } from '@/libs/record'
import { Toolbar } from './Toolbar'
import { PickerOverlay } from './PickerOverlay'
import { useActive, usePicker, useSize, useTargetNode, useView } from './hooks'
import { Shortcuts } from 'shortcuts'
import {
  createLivePlayback,
  createRecordingPlayback,
  Playback,
  PlaybackCanvas,
  PlaybackProvider,
} from '@/libs/playback'
import { View } from './types'
import { ElementsPanel } from './ElementsPanel'
import { NetworkPanel } from './NetworkPanel'
import { ConsolePanel } from './ConsolePanel'

const MIN_SIZE = 60
const MAX_SIZE = 640

export const DevTools: React.FC = () => {
  const stream = useRecordingStream()
  const [playback, setPlayback] = useState<Playback | null>(null)
  const [active, setActive] = useActive()
  const [picker, setPicker] = usePicker()
  const [size, setSize] = useSize()
  const [, setTargetNode] = useTargetNode()
  const [view] = useView()
  const [initialSize, setInitialSize] = useState(size)
  const [maskPlaybackRegion, setMaskPlaybackRegion] = useState(false)

  const handleDrag = (offset: number) => {
    setSize(Math.max(MIN_SIZE, Math.min(MAX_SIZE, initialSize + offset)))
  }

  const handleDragStart = () => {
    setInitialSize(size)
    setMaskPlaybackRegion(true)
  }

  const handleDragEnd = () => {
    setInitialSize(size)
    setMaskPlaybackRegion(false)
    // TODO: persist size to extension storage
  }

  useEffect(() => {
    stream.start()
    return () => stream.stop()
  }, [stream])

  useEffect(() => {
    setPlayback(active ? createRecordingPlayback(stream.slice()) : null)
  }, [active, setPlayback])

  useEffect(() => {
    if (playback) {
      playback.seekToTime(playback.getDuration())
    }
  }, [playback])

  useEffect(() => {
    if (!picker) {
      setTargetNode(null)
    }
  }, [picker, setTargetNode])

  useEffect(() => {
    const shortcuts = new Shortcuts()

    shortcuts.add([
      {
        shortcut: 'Ctrl+Alt+Shift+I',
        handler: () => setActive(active => !active),
      },

      {
        shortcut: 'Ctrl+Alt+Shift+C',
        handler: () => setPicker(picker => !picker),
      },
    ])

    return () => {
      shortcuts.reset()
    }
  }, [])

  return (
    <PlaybackProvider playback={playback}>
      <Container>
        {playback && (
          <PlaybackRegion mask={maskPlaybackRegion}>
            <PlaybackCanvas interactive={true} scaling="full-width" />
          </PlaybackRegion>
        )}

        {picker && <PickerOverlay />}

        <InspectorRegion>
          {active && (
            <DragHandle
              edge="top"
              onDrag={handleDrag}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          )}

          <Toolbar />

          {active && (
            <ContentRegion>
              {view === View.Elements && <ElementsPanel />}
              {view === View.Network && <NetworkPanel />}
              {view === View.Console && <ConsolePanel />}
            </ContentRegion>
          )}
        </InspectorRegion>
      </Container>
    </PlaybackProvider>
  )
}

const MAX_INT32 = 2 ** 32 - 1

const Container: React.FC = ({ children }) => (
  <Block position="fixed" bottom={0} left={0} right={0} zIndex={MAX_INT32}>
    {children}
  </Block>
)

const PlaybackRegion: React.FC<{ mask: boolean }> = ({ children, mask }) => (
  <Block
    position="fixed"
    top={0}
    bottom={0}
    left={0}
    right={0}
    pointerEvents={mask ? 'none' : 'all'}
  >
    {children}
  </Block>
)

const InspectorRegion: React.FC = ({ children }) => (
  <Grid
    isolation="isolate"
    backgroundColor={colors.white}
    gridTemplateRows="50px auto"
    boxShadow={`0 -4px 16px rgba(0, 0, 0, 0.1)`}
  >
    {children}
  </Grid>
)

const ContentRegion: React.FC = ({ children }) => {
  const [size] = useSize()
  return (
    <Block
      height={size}
      borderTopStyle="solid"
      borderTopWidth={1}
      borderTopColor={colors.blueGray['300']}
    >
      {children}
    </Block>
  )
}
