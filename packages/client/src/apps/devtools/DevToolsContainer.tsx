import React, { useEffect, useRef, useState } from 'react'
import { useRecordingStream } from '@/libs/record'
import {
  useActive,
  useCurrentDocument,
  useExporting,
  useInspecting,
  usePicker,
  useTargetNodeId,
} from './hooks'
import { Shortcuts } from 'shortcuts'
import {
  createRecordingPlayback,
  Playback,
  PlaybackProvider,
} from '@/libs/playback'
import { DevTools } from './DevTools'
import { first, from, map, Subscription } from 'rxjs'
import { VTree } from '@/types/vdom'
import { isDocumentVNode, isElementVNode } from '@/utils/vdom'

export const DevToolsContainer: React.FC = () => {
  const initialDocumentOverflow = useRef<string>('auto')
  const stream = useRecordingStream()

  const [playback, setPlayback] = useState<Playback | null>(null)
  const active = useActive()
  const [inspecting, setInspecting] = useInspecting()
  const [, setExporting] = useExporting()
  const [picker, setPicker] = usePicker()
  const [, setCurrentDocument] = useCurrentDocument()
  const [, setTargetNodeId] = useTargetNodeId()

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
      setTargetNodeId(null)
    } else {
      if (playback) {
        subscription.add(
          playback.$snapshot
            .pipe(
              first(snapshot => snapshot.dom !== null),
              map(snapshot => snapshot.dom as VTree),
              map(vtree => getBodyVElement(vtree))
            )
            .subscribe(node => {
              if (node) {
                setTargetNodeId(node.id)
              }
            })
        )
      }
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [active, playback, setTargetNodeId])

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
          setPlayback(createRecordingPlayback(recording))
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
      setTargetNodeId(null)
    }
  }, [picker, setTargetNodeId])

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
      {
        shortcut: 'CmdOrCtrl+Alt+Shift+S',
        handler: () => setExporting(exporting => !exporting),
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
      ])
    }

    return () => {
      shortcuts.reset()
    }
  }, [inspecting, setPicker, setExporting])

  return (
    <PlaybackProvider playback={playback}>
      <DevTools />
    </PlaybackProvider>
  )
}

function getBodyVElement(vtree: VTree) {
  const rootNode = vtree.nodes[vtree.rootId]

  if (!rootNode || !isDocumentVNode(rootNode)) {
    return null
  }

  const documentElementNode = rootNode.children
    .map(childId => vtree.nodes[childId])
    .find(node => node && isElementVNode(node) && node.tagName === 'html')

  if (!documentElementNode || !isElementVNode(documentElementNode)) {
    return null
  }

  const bodyNode = documentElementNode.children
    .map(childId => vtree.nodes[childId])
    .find(node => node && isElementVNode(node) && node.tagName === 'body')

  if (!bodyNode || !isElementVNode(bodyNode)) {
    return null
  }

  return bodyNode
}
