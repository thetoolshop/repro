import {
  DOMPatchEvent,
  NodeId,
  PatchType,
  SourceEvent,
  SourceEventType,
} from '@repro/domain'
import { BreakpointType, type Breakpoint } from '../types'

export function findMatchingBreakpoint(
  event: SourceEvent,
  breakpoints: Array<Breakpoint>
): Breakpoint | null {
  if (breakpoints.length === 0) {
    return null
  }

  const domPatch = event
    .filter<DOMPatchEvent>(event => event.type === SourceEventType.DOMPatch)
    .flatMap(event => event.data)

  const targetId = domPatch.map(domPatch => {
    let targetId: NodeId

    switch (domPatch.type) {
      case PatchType.AddNodes:
      case PatchType.RemoveNodes:
        // TODO: Handle added and removed nodes
        // - [ ] Break _after_ nodes are added
        // - [ ] Break _before_ nodes are removed
        // We likely need to consider pairs of events
        targetId = domPatch.parentId
        break

      case PatchType.Attribute:
      case PatchType.BooleanProperty:
      case PatchType.NumberProperty:
      case PatchType.Text:
      case PatchType.TextProperty:
        targetId = domPatch.targetId
        break
    }

    return targetId
  })

  const breakpoint = targetId.map(targetId => {
    for (const breakpoint of breakpoints) {
      if (
        breakpoint.type === BreakpointType.VNode &&
        breakpoint.nodeId === targetId
      ) {
        return breakpoint
      }
    }

    return null
  })

  return breakpoint.orElse(null)
}
