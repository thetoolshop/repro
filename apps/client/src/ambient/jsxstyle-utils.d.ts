import type { BaseCSSProperties } from 'jsxstyle-utils'

declare module 'jsxstyle-utils' {
  interface CSSProperties {
    focusBorderColor?: BaseCSSProperties['borderColor']
    focusOutline?: BaseCSSProperties['outline']

    hoverBorderColor?: BaseCSSProperties['borderColor']
    hoverBorderWidth?: BaseCSSProperties['borderSize']

    hoverBorderBottom?: BaseCSSProperties['borderBottom']
    hoverBorderLeft?: BaseCSSProperties['borderLeft']
    hoverBorderRight?: BaseCSSProperties['borderRight']
    hoverBorderTop?: BaseCSSProperties['borderTop']

    hoverHeight?: BaseCSSProperties['height']
    hoverWidth?: BaseCSSProperties['width']

    hoverVisibility?: BaseCSSProperties['visibility']
    emptyVisibility?: BaseCSSProperties['visibility']
  }
}
