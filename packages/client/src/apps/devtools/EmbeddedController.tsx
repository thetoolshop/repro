import React, { useEffect, useRef, useState } from 'react'
import { from, Subscription } from 'rxjs'
import { Shortcuts } from 'shortcuts'
import { useRecordingStream } from '@/libs/record'
import {
  createSourcePlayback,
  Playback,
  PlaybackProvider,
} from '@/libs/playback'
import { MAX_INT32 } from './constants'
import { DevTools } from './DevTools'
import {
  useActive,
  useCurrentDocument,
  useExporting,
  useFocusedNode,
  useSelectedNode,
  useInspecting,
  usePicker,
} from './hooks'
import { Block } from 'jsxstyle'

export const EmbeddedController: React.FC = () => {
  const initialDocumentOverflow = useRef<string>('auto')
  const stream = useRecordingStream()

  const [playback, setPlayback] = useState<Playback | null>(null)
  const active = useActive()
  const [inspecting, setInspecting] = useInspecting()
  const [, setExporting] = useExporting()
  const [picker, setPicker] = usePicker()
  const [, setCurrentDocument] = useCurrentDocument()
  const [, setFocusedNode] = useFocusedNode()
  const [, setSelectedNode] = useSelectedNode()

  useEffect(() => {
    initialDocumentOverflow.current = window.getComputedStyle(
      document.documentElement
    ).overflow
  }, [initialDocumentOverflow])

  useEffect(() => {
    if (inspecting) {
      const overrideStyles = document.createElement('style')
      overrideStyles.classList.add('repro-ignore')
      overrideStyles.id = 'repro-style-overrides'
      overrideStyles.appendChild(
        document.createTextNode('html { overflow: hidden !important; }')
      )

      document.head.appendChild(overrideStyles)
    }

    return () => {
      const overrideStyles = document.querySelector('#repro-style-overrides')

      if (overrideStyles) {
        overrideStyles.remove()
      }
    }
  }, [inspecting])

  useEffect(() => {
    const subscription = new Subscription()

    if (!active) {
      setCurrentDocument(document)
      setSelectedNode(null)
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [active, playback, setSelectedNode])

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
    const subscription = new Subscription()

    if (active) {
      subscription.add(
        from(stream.slice()).subscribe(recording => {
          setPlayback(createSourcePlayback(recording))
        })
      )
    } else {
      setPlayback(null)
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [active, setPlayback])

  useEffect(() => {
    if (playback) {
      playback.seekToTime(playback.getDuration())
    }
  }, [playback])

  useEffect(() => {
    if (!picker) {
      setFocusedNode(null)
    }
  }, [picker, setFocusedNode])

  useEffect(() => {
    const shortcuts = new Shortcuts()

    shortcuts.add([
      {
        shortcut: 'CmdOrCtrl+Alt+Shift+I',
        handler: () => {
          setPicker(false)
          setInspecting(inspecting => !inspecting)
        },
      },
    ])

    return () => {
      shortcuts.reset()
    }
  }, [setPicker, setExporting, setInspecting])

  useEffect(() => {
    const shortcuts = new Shortcuts()

    if (inspecting) {
      shortcuts.add([
        {
          shortcut: 'CmdOrCtrl+Alt+Shift+C',
          handler: () => setPicker(picker => !picker),
        },
        {
          shortcut: 'CmdOrCtrl+Alt+Shift+S',
          handler: () => setExporting(exporting => !exporting),
        },
      ])
    }

    return () => {
      shortcuts.reset()
    }
  }, [inspecting, setPicker, setExporting])

  return (
    <PlaybackProvider playback={playback}>
      <Block
        position="fixed"
        top={inspecting ? 0 : 'auto'}
        bottom={0}
        left={0}
        right={0}
        zIndex={MAX_INT32}
      >
        <DevTools />
      </Block>
    </PlaybackProvider>
  )
}
