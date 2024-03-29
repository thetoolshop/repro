export {}

declare module 'jsxstyle' {
  interface CSSProperties {
    focusBorderColor?: CSSProperties['borderColor']
    focusOutline?: CSSProperties['outline']

    hoverBorderColor?: CSSProperties['borderColor']
    hoverBorderWidth?: CSSProperties['borderWidth']

    hoverBorderBottom?: CSSProperties['borderBottom']
    hoverBorderLeft?: CSSProperties['borderLeft']
    hoverBorderRight?: CSSProperties['borderRight']
    hoverBorderTop?: CSSProperties['borderTop']

    hoverHeight?: CSSProperties['height']
    hoverWidth?: CSSProperties['width']

    hoverVisibility?: CSSProperties['visibility']
    emptyVisibility?: CSSProperties['visibility']

    emptyDisplay?: CSSProperties['display']
  }
}
