import { Block, Grid } from 'jsxstyle'
import React, { useCallback } from 'react'
import { colors } from '@/config/theme'
import { PlaybackCanvas } from '@/libs/playback'
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
  useExporting,
  useInspecting,
  useMask,
  usePicker,
  useSize,
  useView,
} from './hooks'
import { ExporterModal } from './Exporter'

interface Props {
  disableExport?: boolean
  disableToggle?: boolean
}

export const DevTools: React.FC<Props> = React.memo(
  ({ disableExport, disableToggle }) => {
    const [, setCurrentDocument] = useCurrentDocument()
    const [inspecting] = useInspecting()
    const [exporting, setExporting] = useExporting()
    const [picker] = usePicker()
    const [mask] = useMask()
    const [view] = useView()

    const closeExporter = useCallback(() => {
      setExporting(false)
    }, [setExporting])

    return (
      <Container open={inspecting}>
        {inspecting && (
          <PlaybackRegion mask={mask}>
            <PlaybackCanvas
              interactive={false}
              scaling="full-width"
              onDocumentReady={setCurrentDocument}
            />
          </PlaybackRegion>
        )}

        {picker && <PickerOverlay />}

        <InspectorRegion>
          {inspecting && <DragHandle />}

          <Toolbar
            disableExport={disableExport}
            disableToggle={disableToggle}
          />

          {inspecting && (
            <ContentRegion>
              {view === View.Elements && <ElementsPanel />}
              {view === View.Network && <NetworkPanel />}
              {view === View.Console && <ConsolePanel />}
            </ContentRegion>
          )}
        </InspectorRegion>

        {exporting && <ExporterModal onClose={closeExporter} />}
      </Container>
    )
  }
)

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
  <Block
    gridArea="playback"
    pointerEvents={mask ? 'none' : 'all'}
    backgroundColor={colors.white}
  >
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
      borderTopColor={colors.slate['300']}
      overflow="auto"
    >
      {children}
    </Block>
  )
}
