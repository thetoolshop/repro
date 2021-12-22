import { Block, Grid } from 'jsxstyle'
import React, { useEffect, useRef, useState } from 'react'
import { DragHandle } from '@/components/DragHandle'
import { colors } from '@/config/theme'
import { useRecordingStream } from '@/libs/record'
import { Toolbar } from './Toolbar'
import { PickerOverlay } from './PickerOverlay'
import { useActive, usePicker, useSize, useTargetNode, useView } from './hooks'
import { Shortcuts } from 'shortcuts'
import {
  createRecordingPlayback,
  Playback,
  PlaybackCanvas,
  PlaybackProvider,
} from '@/libs/playback'
import { View } from './types'
import { ElementsPanel } from './ElementsPanel'
import { NetworkPanel } from './NetworkPanel'
import { ConsolePanel } from './ConsolePanel'
import { MAX_INT32 } from './constants'

const MIN_HEIGHT = 60
const MAX_HEIGHT = 640

export const DevTools: React.FC = () => {
  const initialDocumentOverflow = useRef<string>('auto')
  const stream = useRecordingStream()
  const [playback, setPlayback] = useState<Playback | null>(null)
  const [active, setActive] = useActive()
  const [picker, setPicker] = usePicker()
  const [size, setSize] = useSize()
  const [, setTargetNode] = useTargetNode()
  const [view] = useView()
  const [initialSize, setInitialSize] = useState(size)
  const [maskPlaybackRegion, setMaskPlaybackRegion] = useState(false)
  const [playbackTargetDocument, setPlaybackTargetDocument] = useState(document)

  const handleDrag = (offset: number) => {
    setSize(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, initialSize + offset)))
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
    initialDocumentOverflow.current = window.getComputedStyle(
      document.documentElement
    ).overflow
  }, [initialDocumentOverflow])

  useEffect(() => {
    document.documentElement.style.overflow = active
      ? 'hidden'
      : initialDocumentOverflow.current

    return () => {
      document.documentElement.style.overflow = initialDocumentOverflow.current
    }
  }, [active])

  useEffect(() => {
    stream.start()

    const onVisibilityChange = () => {
      // TODO: stop after timeout?

      if (document.visibilityState === 'hidden') {
        stream.stop()
      } else {
        if (!stream.isStarted()) {
          stream.start()
        }
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stream.stop()
    }
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
      <Container open={!!(active && playback)}>
        {playback && (
          <PlaybackRegion mask={maskPlaybackRegion}>
            <PlaybackCanvas
              interactive={true}
              scaling="full-width"
              onDocumentReady={setPlaybackTargetDocument}
            />
          </PlaybackRegion>
        )}

        {picker && <PickerOverlay targetDocument={playbackTargetDocument} />}

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

const Container: React.FC<{ open: boolean }> = ({ children, open }) => (
  <Grid
    position="fixed"
    top={open ? 0 : 'auto'}
    bottom={0}
    left={0}
    right={0}
    gridTemplateRows={open ? '1fr auto' : 'auto'}
    gridTemplateAreas={`"playback" "inspector"`}
    zIndex={MAX_INT32}
  >
    {children}
  </Grid>
)

const PlaybackRegion: React.FC<{ mask: boolean }> = ({ children, mask }) => (
  <Block gridArea="playback" pointerEvents={mask ? 'none' : 'all'}>
    {children}
  </Block>
)

const InspectorRegion: React.FC = ({ children }) => (
  <Grid
    gridArea="inspector"
    position="relative"
    isolation="isolate"
    backgroundColor={colors.white}
    gridTemplateRows="50px auto"
    boxShadow={`0 -4px 16px rgba(0, 0, 0, 0.1)`}
    zIndex={MAX_INT32}
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
