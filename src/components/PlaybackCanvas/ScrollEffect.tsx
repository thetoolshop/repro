import React, { MutableRefObject, useEffect, useRef } from 'react'
import { Point } from '@/types/interaction';

interface Props {
  state: Point | null
  elementRef?: HTMLElement | null
}

export const ScrollEffect: React.FC<Props> = ({ children, elementRef, state }) => {
  const ref = useRef() as MutableRefObject<HTMLElement>

  useEffect(() => {
    const target = elementRef || ref.current

    if (target && state) {
      target.scrollTo({
        left: state[0],
        top: state[1],
        behavior: 'smooth',
      })
    }
  }, [elementRef, ref, state])

  if (elementRef) {
    return (
      <React.Fragment>
        {children}
      </React.Fragment>
    )
  }

  const child = React.Children.only(children)

  return (
    <React.Fragment>
      {React.isValidElement(child) && React.cloneElement(child, { ref })}
    </React.Fragment>
  )
}
