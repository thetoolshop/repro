import { Block, Row } from 'jsxstyle'
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Loader as LoaderIcon } from 'lucide-react'
import { FrameRealm } from '~/components/FrameRealm'
import * as FX from '~/components/FX'
import { colors } from '~/config/theme'
import { InteractionMask } from './InteractionMask'
import { NativeDOMRenderer } from './NativeDOMRenderer'
import { PointerOverlay } from './PointerOverlay'
import { FullWidthViewport } from './FullWidthViewport'
import { ScaleToFitViewport } from './ScaleToFitViewport'
import { MutableNodeMap } from './types'

interface Props {
  interactive: boolean
  trackPointer: boolean
  trackScroll: boolean
  scaling: 'full-width' | 'scale-to-fit'
  onDocumentReady?: (doc: Document) => void
  onLoad?: (nodeMap: MutableNodeMap) => void
}

export const PlaybackCanvas: React.FC<Props> = ({
  interactive,
  trackPointer,
  trackScroll,
  scaling,
  onDocumentReady,
  onLoad,
}) => {
  const frameRef = useRef() as MutableRefObject<HTMLIFrameElement>
  const [ownerDocument, setOwnerDocument] = useState<Document | null>(null)
  const [loaded, setLoaded] = useState(false)

  const handleLoad = useCallback(
    (nodeMap: MutableNodeMap) => {
      if (onLoad) {
        onLoad(nodeMap)
      }

      setLoaded(true)
    },
    [onLoad, setLoaded]
  )

  useEffect(() => {
    if (!frameRef.current) {
      setOwnerDocument(null)
      return
    }

    const contentDocument = frameRef.current.contentDocument
    setOwnerDocument(contentDocument)

    if (contentDocument && onDocumentReady) {
      onDocumentReady(contentDocument)
    }
  }, [frameRef, setOwnerDocument, onDocumentReady])

  const viewportContents = (
    <React.Fragment>
      <FrameRealm ref={frameRef}>
        <NativeDOMRenderer
          trackScroll={trackScroll}
          ownerDocument={ownerDocument}
          onLoad={handleLoad}
        />
      </FrameRealm>

      {trackPointer && <PointerOverlay />}
      {!interactive && <InteractionMask />}
    </React.Fragment>
  )

  return (
    <Block
      overflow="hidden"
      height="100%"
      background={`repeating-linear-gradient(
        45deg,
        ${colors.slate['50']},
        ${colors.slate['50']} 10px,
        ${colors.slate['100']} 10px,
        ${colors.slate['100']} 20px
      )`}
    >
      {!loaded && (
        <Row alignItems="center" justifyContent="center" height="100%">
          <FX.Spin height={24} color={colors.slate['500']}>
            <LoaderIcon size={24} />
          </FX.Spin>
        </Row>
      )}

      {scaling === 'full-width' && (
        <FullWidthViewport>{viewportContents}</FullWidthViewport>
      )}

      {scaling === 'scale-to-fit' && (
        <ScaleToFitViewport>{viewportContents}</ScaleToFitViewport>
      )}
    </Block>
  )
}
