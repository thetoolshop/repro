import { VElement, VTree } from '@repro/domain'
import { createVTreeWalker } from './createVTreeWalker'

export function findElementsByClassName(
  vtree: VTree,
  className: string
): Array<VElement> {
  const nodes: Array<VElement> = []
  const walkTree = createVTreeWalker()

  walkTree.accept({
    // Not implemented
    documentNode() {},
    docTypeNode() {},
    textNode() {},

    elementNode(node) {
      if (node.attributes['class'] != null) {
        const classList = node.attributes['class'].split(/\s+/)

        if (classList.includes(className)) {
          nodes.push(node)
        }
      }
    },
  })

  walkTree(vtree)

  return nodes
}
