import { colors } from '@/config/theme'
import { isIFrameElement } from '@/utils/dom'
import { Block } from 'jsxstyle'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { fromEvent, Subscription } from 'rxjs'
import { distinctUntilChanged, map, share } from 'rxjs/operators'
import { MAX_INT32 } from '../constants'
import {
  useCurrentDocument,
  useFocusedNode,
  useSelectedNode,
  usePicker,
} from '../hooks'

function getTargetElementAtPoint(doc: Document | null, x: number, y: number) {
  if (!doc) {
    return null
  }

  let targetElement = doc.elementsFromPoint(x, y)[0]

  while (targetElement && isIFrameElement(targetElement)) {
    const doc = targetElement.contentDocument
    const offsetX = targetElement.offsetLeft
    const offsetY = targetElement.offsetTop

    if (doc) {
      targetElement = doc.elementsFromPoint(x - offsetX, y - offsetY)[0]
    }
  }

  return targetElement || null
}

export const PickerOverlay: React.FC = React.memo(() => {
  const [picker, setPicker] = usePicker()
  const [currentDocument] = useCurrentDocument()
  const [focusedNode, setFocusedNode] = useFocusedNode()
  const [, setSelectedNode] = useSelectedNode()
  const [targetElement, setTargetElement] = useState<Element | null>(null)
  const [boundingBox, setBoundingBox] = useState<DOMRect | null>(null)
  const ref = useRef() as MutableRefObject<HTMLDivElement>

  useEffect(() => {
    setTargetElement(
      focusedNode && currentDocument
        ? currentDocument.querySelector(`[data-repro-node="${focusedNode}"]`)
        : null
    )
  }, [focusedNode, setTargetElement])

  useEffect(() => {
    setBoundingBox(targetElement ? targetElement.getBoundingClientRect() : null)
  }, [targetElement, setBoundingBox])

  useEffect(() => {
    const subscription = new Subscription()

    if (picker) {
      const elem$ = fromEvent<PointerEvent>(ref.current, 'pointermove', {
        capture: true,
        passive: true,
      }).pipe(
        map(evt =>
          getTargetElementAtPoint(currentDocument, evt.clientX, evt.clientY)
        ),
        distinctUntilChanged(),
        share()
      )

      /**
       * TODO: investigate performance regression
       * - Likely requires optimisation of ElementTree (native renderer?)
       *
      subscription.add(
        elem$.subscribe(target => {
          setFocusedNode(target ? target.getAttribute('data-repro-node') : null)
        })
      )
      /**/

      subscription.add(elem$.subscribe(target => setTargetElement(target)))

      subscription.add(
        fromEvent<PointerEvent>(ref.current, 'pointerdown')
          .pipe(
            map(evt => {
              const target = getTargetElementAtPoint(
                currentDocument,
                evt.clientX,
                evt.clientY
              )

              return target ? target.getAttribute('data-repro-node') : null
            })
          )
          .subscribe(nodeId => {
            setSelectedNode(nodeId)
            setFocusedNode(null)
            setPicker(false)
          })
      )
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [currentDocument, ref, setBoundingBox, setFocusedNode, picker, setPicker])

  return (
    <Block
      position="absolute"
      top={0}
      bottom={0}
      left={0}
      right={0}
      zIndex={MAX_INT32}
      pointerEvents={picker ? 'all' : 'none'}
      props={{ ref }}
    >
      <svg width="100%" height="100%">
        {boundingBox && (
          <g>
            <line
              x1={boundingBox.x}
              x2={boundingBox.x}
              y1={0}
              y2="100%"
              stroke={colors.pink['500']}
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <line
              x1={boundingBox.x + boundingBox.width}
              x2={boundingBox.x + boundingBox.width}
              y1={0}
              y2="100%"
              stroke={colors.pink['500']}
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <line
              x1={0}
              x2="100%"
              y1={boundingBox.y}
              y2={boundingBox.y}
              stroke={colors.pink['500']}
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <line
              x1={0}
              x2="100%"
              y1={boundingBox.y + boundingBox.height}
              y2={boundingBox.y + boundingBox.height}
              stroke={colors.pink['500']}
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <rect
              x={boundingBox.x}
              y={boundingBox.y}
              width={boundingBox.width}
              height={boundingBox.height}
              fill={`${colors.pink['500']}33`}
              stroke={colors.pink['500']}
              strokeWidth={2}
            />
          </g>
        )}
      </svg>
    </Block>
  )
})
