import {
  NodeType,
  SyntheticId,
  VDocType,
  VDocument,
  VElement,
  VText,
  VTree,
} from '@repro/domain'

interface VNodeVisitor {
  documentNode(node: VDocument, vtree: VTree): void
  docTypeNode(node: VDocType, vtree: VTree): void
  elementNode(node: VElement, vtree: VTree): void
  textNode(node: VText, vtree: VTree): void
}

interface VTreeWalker {
  (vtree: VTree): void
  accept(visitor: VNodeVisitor): void
}

export function createVTreeWalker(): VTreeWalker {
  const visitors: Array<VNodeVisitor> = []

  function walkVTree(vtree: VTree) {
    const queue: Array<SyntheticId> = [vtree.rootId]

    let nodeId: SyntheticId | undefined

    while ((nodeId = queue.shift())) {
      const node = vtree.nodes[nodeId]

      if (!node) {
        continue
      }

      for (const visitor of visitors) {
        switch (node.type) {
          case NodeType.Document:
            visitor.documentNode(node, vtree)
            break

          case NodeType.DocType:
            visitor.docTypeNode(node, vtree)
            break

          case NodeType.Element:
            visitor.elementNode(node, vtree)
            break

          case NodeType.Text:
            visitor.textNode(node, vtree)
            break
        }
      }

      if ('children' in node) {
        queue.push(...node.children)
      }
    }
  }

  walkVTree.accept = (visitor: VNodeVisitor) => {
    visitors.push(visitor)
  }

  return walkVTree
}
