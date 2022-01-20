import { useElapsed, useLatestControlFrame } from '@/libs/playback'
import { isElementNode } from '@/utils/dom'
import { Block } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { useTargetElement } from '../hooks'

type CSSProperties = keyof CSSStyleDeclaration

export const TargetNodeComputedStyle: React.FC = () => {
  const targetElement = useTargetElement()
  const latestControlFrame = useLatestControlFrame()
  const elapsed = useElapsed()
  const [computedStyle, setComputedStyle] =
    useState<CSSStyleDeclaration | null>(null)

  useEffect(() => {
    if (!targetElement) {
      setComputedStyle(null)
      return
    }

    if (!isElementNode(targetElement)) {
      setComputedStyle(null)
      return
    }

    const doc = targetElement.ownerDocument
    const win = doc ? doc.defaultView : null
    const computedStyle = win ? win.getComputedStyle(targetElement) : null

    setComputedStyle(computedStyle)
  }, [targetElement, latestControlFrame, setComputedStyle])

  useEffect(() => {
    // TODO: exclude unapplied styles
    if (computedStyle) {
      getMargin(computedStyle)
    }
  }, [computedStyle, elapsed])

  return computedStyle ? (
    <Block padding={16}>
      {(Array.from(computedStyle) as Array<CSSProperties>).map(key => (
        <Block key={key} fontFamily="monospace" fontSize={12} lineHeight={1.5}>
          {key}: {computedStyle[key]}
        </Block>
      ))}
    </Block>
  ) : null
}

type Box = Record<'left' | 'right' | 'top' | 'bottom', number>

function getMargin(computedStyle: CSSStyleDeclaration): Box {
  return {
    left: resolveValue(computedStyle.marginLeft),
    right: resolveValue(computedStyle.marginRight),
    top: resolveValue(computedStyle.marginTop),
    bottom: resolveValue(computedStyle.marginBottom),
  }
}

function getPadding(computedStyle: CSSStyleDeclaration) {
  return {
    left: resolveValue(computedStyle.paddingLeft),
    right: resolveValue(computedStyle.paddingRight),
    top: resolveValue(computedStyle.paddingTop),
    bottom: resolveValue(computedStyle.paddingBottom),
  }
}

function getBorder(computedStyle: CSSStyleDeclaration) {
  return {
    left: resolveValue(computedStyle.borderLeftWidth),
    right: resolveValue(computedStyle.borderRightWidth),
    top: resolveValue(computedStyle.borderTopWidth),
    bottom: resolveValue(computedStyle.borderBottomWidth),
  }
}

function resolveValue(value: string): number {
  return parseInt(value.substring(0, value.length - 2), 10) || 0
}
