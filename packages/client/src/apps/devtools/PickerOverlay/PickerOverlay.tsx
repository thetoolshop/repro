import { colors } from '@/config/theme'
import { SyntheticId } from '@/types/common'
import { getNodeId } from '@/utils/vdom'
import { Block } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { fromEvent, Subscription } from 'rxjs'
import { distinctUntilChanged, map, share } from 'rxjs/operators'
import { MAX_INT32 } from '../constants'
import { useActive, useCurrentDocument, useTargetNodeId } from '../hooks'

export const PickerOverlay: React.FC = React.memo(() => {
  const [, setActive] = useActive()
  const [currentDocument] = useCurrentDocument()
  const [, setTargetNodeId] = useTargetNodeId()
  const [boundingBox, setBoundingBox] = useState<DOMRect | null>(null)

  useEffect(() => {
    const subscription = new Subscription()

    const targetElement$ = fromEvent<PointerEvent>(window, 'pointermove').pipe(
      map(evt => {
        if (!currentDocument) {
          return null
        }

        return (
          currentDocument.elementsFromPoint(evt.clientX, evt.clientY)[1] || null
        )
      }),
      distinctUntilChanged(),
      share()
    )

    subscription.add(
      targetElement$.subscribe(target => {
        setBoundingBox(target ? target.getBoundingClientRect() : null)
      })
    )

    subscription.add(
      targetElement$.subscribe(target => {
        let targetNodeId: SyntheticId | null = null

        if (target) {
          targetNodeId =
            target.getAttribute('data-repro-node') || getNodeId(target)
        }

        setTargetNodeId(targetNodeId)
      })
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [currentDocument, setBoundingBox, setTargetNodeId])

  const handleClick = () => {
    setActive(true)
  }

  return (
    <Block
      position="fixed"
      top={0}
      bottom={0}
      left={0}
      right={0}
      zIndex={MAX_INT32}
      props={{
        onClick: handleClick,
      }}
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
