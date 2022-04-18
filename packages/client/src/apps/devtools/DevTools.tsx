import { Block, Grid } from 'jsxstyle'
import React, { useCallback, useEffect } from 'react'
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
  useFocusedNode,
  useInspecting,
  useMask,
  useNodeMap,
  usePicker,
  useSize,
  useView,
} from './hooks'
import { ExporterModal } from './Exporter'
import { ReferenceStyleProvider } from '@/libs/styles'
import { Analytics } from '@/libs/analytics'

interface Props {
  disableExport?: boolean
  disableToggle?: boolean
  hideLogo?: boolean
}

export const DevTools: React.FC<Props> = React.memo(
  ({ disableExport, disableToggle, hideLogo }) => {
    const [, setCurrentDocument] = useCurrentDocument()
    const [, setNodeMap] = useNodeMap()
    const [inspecting] = useInspecting()
    const [picker] = usePicker()
    const [exporting, setExporting] = useExporting()
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

    useEffect(() => {
      if (exporting) {
        Analytics.track('export:open-modal')
      }
    }, [exporting])

    const closeExporter = useCallback(() => {
      setExporting(false)
      setFocusedNode(null)
    }, [setExporting, setFocusedNode])

    return (
      <Container open={inspecting}>
        <ReferenceStyleProvider>
          {inspecting && (
            <PlaybackRegion mask={mask}>
              <PlaybackCanvas
                interactive={true}
                scaling="full-width"
                onDocumentReady={setCurrentDocument}
                onLoad={setNodeMap}
              />

              <PickerOverlay />
            </PlaybackRegion>
          )}

          <InspectorRegion>
            {inspecting && <DragHandle />}

            <Toolbar
              disableExport={disableExport}
              disableToggle={disableToggle}
              hideLogo={hideLogo}
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
        </ReferenceStyleProvider>
      </Container>
    )
  }
)

const Container: React.FC<{ open: boolean }> = ({ children, open }) => (
  <Grid
    height="100%"
    gridTemplateRows={open ? '1fr auto' : 'auto'}
    gridTemplateAreas={`"playback" "inspector"`}
  >
    {children}
  </Grid>
)

const PlaybackRegion: React.FC<{ mask: boolean }> = ({ children, mask }) => (
  <Block
    position="relative"
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
