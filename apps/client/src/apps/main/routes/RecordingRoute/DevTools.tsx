import { Block, Grid } from 'jsxstyle'
import React, { PropsWithChildren, useEffect } from 'react'
import { colors } from '~/config/theme'
import { PlaybackCanvas } from '~/libs/playback'
import { Toolbar } from './Toolbar'
import { PickerOverlay } from './PickerOverlay'
import { View } from './types'
import { ElementsPanel } from './ElementsPanel'
import { NetworkPanel } from './NetworkPanel'
import { ConsolePanel } from './ConsolePanel'
import { DragHandle } from './DragHandle'
import { MAX_INT32 } from './constants'
import {
  useCurrentDocument,
  useFocusedNode,
  useInspecting,
  useMask,
  useNodeMap,
  usePicker,
  useSize,
  useView,
} from './hooks'
import { ReferenceStyleProvider } from '~/libs/styles'
import { Analytics } from '~/libs/analytics'

interface Props {
  disableExport?: boolean
  disableToggle?: boolean
  hideLogo?: boolean
}

export const DevTools: React.FC<Props> = React.memo(() => {
  const [, setCurrentDocument] = useCurrentDocument()
  const [, setNodeMap] = useNodeMap()
  const [inspecting] = useInspecting()
  const [picker] = usePicker()
  const [, setFocusedNode] = useFocusedNode()
  const [mask] = useMask()
  const [view] = useView()

  useEffect(() => {
    if (inspecting) {
      Analytics.track('inspect:open-devtools')
    }
  }, [inspecting])

  useEffect(() => {
    if (picker) {
      Analytics.track('inspect:use-picker')
    }
  }, [picker])

  return (
    <Container>
      <ReferenceStyleProvider>
        <PlaybackRegion mask={mask}>
          <PlaybackCanvas
            interactive={false}
            trackPointer={true}
            trackScroll={true}
            scaling="scale-to-fit"
            onDocumentReady={setCurrentDocument}
            onLoad={setNodeMap}
          >
            <PickerOverlay />
          </PlaybackCanvas>
        </PlaybackRegion>

        <InspectorRegion>
          <Toolbar />

          <DragHandle />

          <ContentRegion>
            {view === View.Elements && <ElementsPanel />}
            {view === View.Network && <NetworkPanel />}
            {view === View.Console && <ConsolePanel />}
          </ContentRegion>
        </InspectorRegion>
      </ReferenceStyleProvider>
    </Container>
  )
})

const Container: React.FC<PropsWithChildren> = ({ children }) => (
  <Grid
    height="100%"
    gridTemplateRows="1fr auto"
    gridTemplateAreas={`"playback" "inspector"`}
    pointerEvents="auto"
    overflow="hidden"
  >
    {children}
  </Grid>
)

const PlaybackRegion: React.FC<PropsWithChildren<{ mask: boolean }>> = ({
  children,
  mask,
}) => (
  <Block
    height="100%"
    overflow="hidden"
    position="relative"
    gridArea="playback"
    pointerEvents={mask ? 'none' : 'all'}
    backgroundColor={colors.white}
  >
    {children}
  </Block>
)

const InspectorRegion: React.FC<PropsWithChildren> = ({ children }) => (
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

const ContentRegion: React.FC<PropsWithChildren> = ({ children }) => {
  const [size] = useSize()
  return (
    <Block
      height={size}
      borderTopStyle="solid"
      borderTopWidth={1}
      borderTopColor={colors.slate['300']}
      overflow="auto"
    >
      {children}
    </Block>
  )
}
