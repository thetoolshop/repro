import { Block } from 'jsxstyle'
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { colors } from '@/config/theme'
import { useViewport } from '@/libs/playback'
import { Point } from '@/types/interaction'

export const ScaleToFitViewport: React.FC = ({ children }) => {
  const viewport = useViewport()

  const ref = useRef() as MutableRefObject<HTMLDivElement>
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>([0, 0])

  const onScale = useCallback(
    (width: number, height: number) => {
      const widthScale = width / viewport[0]
      const heightScale = height / viewport[1]
      setScale(Math.min(1, widthScale, heightScale))

      const x = (width - viewport[0]) / 2
      const y = (height - viewport[1]) / 2
      setOffset([x, y])
    },
    [viewport, setScale, setOffset]
  )

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      let width: number | null = null
      let height: number | null = null

      for (const entry of entries) {
        const rect = entry.contentRect
        width = rect.width
        height = rect.height
      }

      if (width !== null && height !== null) {
        onScale(width, height)
      }
    })

    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect()
      onScale(width, height)
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [ref, onScale])

  return (
    <Block
      position="relative"
      height="100%"
      background={colors.blueGray['200']}
      props={{ ref }}
    >
      <Block
        width={viewport[0]}
        height={viewport[1]}
        transform={`translate(${offset[0]}px, ${offset[1]}px) scale(${scale})`}
        transformOrigin="center"
      >
        {children}
      </Block>
    </Block>
  )
}
