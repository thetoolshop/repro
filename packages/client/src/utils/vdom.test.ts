import { NodeType, VElement, VText, VTree } from '@/types/vdom'
import { removeSubTreesAtNode } from './vdom'

describe('utils: vdom', () => {
  describe('removeSubTreesAtNode', () => {
    function createVTree(): VTree {
      return {
        rootId: '1',
        nodes: {
          1: {
            id: '1',
            parentId: null,
            type: NodeType.Element,
            tagName: 'div',
            attributes: {},
            properties: {},
            children: ['2', '3', '4'],
          },

          2: {
            id: '2',
            parentId: '1',
            type: NodeType.Element,
            tagName: 'span',
            attributes: {},
            properties: {},
            children: ['5'],
          },

          3: {
            id: '3',
            parentId: '1',
            type: NodeType.Text,
            value: 'foo',
          },

          4: {
            id: '4',
            parentId: '1',
            type: NodeType.Text,
            value: 'bar',
          },

          5: {
            id: '5',
            parentId: '2',
            type: NodeType.Text,
            value: 'baz',
          },
        },
      }
    }

    it('should remove subtrees from a valid parent node', () => {
      const vtree = createVTree()

      removeSubTreesAtNode(vtree, vtree.nodes['1'] as VElement, [
        {
          rootId: '2',
          nodes: {
            '2': vtree.nodes['2'] as VElement,
            '5': vtree.nodes['5'] as VText,
          },
        },
      ])

      expect(vtree).toEqual({
        rootId: '1',
        nodes: {
          1: {
            id: '1',
            parentId: null,
            type: NodeType.Element,
            tagName: 'div',
            attributes: {},
            properties: {},
            children: ['3', '4'],
          },

          3: {
            id: '3',
            parentId: '1',
            type: NodeType.Text,
            value: 'foo',
          },

          4: {
            id: '4',
            parentId: '1',
            type: NodeType.Text,
            value: 'bar',
          },
        },
      })
    })

    it('should not remove subtrees from an invalid parent node', () => {
      const vtree = createVTree()

      removeSubTreesAtNode(vtree, vtree.nodes['2'] as VElement, [
        {
          rootId: '3',
          nodes: {
            '3': vtree.nodes['3'] as VText,
          },
        },
      ])

      expect(vtree).toEqual(createVTree())
    })

    it('should remove subtrees idempotently', () => {
      const vtree = createVTree()

      removeSubTreesAtNode(vtree, vtree.nodes['1'] as VElement, [
        {
          rootId: '2',
          nodes: {
            '2': vtree.nodes['2'] as VElement,
            '5': vtree.nodes['5'] as VText,
          },
        },
      ])

      removeSubTreesAtNode(vtree, vtree.nodes['1'] as VElement, [
        {
          rootId: '2',
          nodes: {
            '2': vtree.nodes['2'] as VElement,
            '5': vtree.nodes['5'] as VText,
          },
        },
      ])

      expect(vtree).toEqual({
        rootId: '1',
        nodes: {
          1: {
            id: '1',
            parentId: null,
            type: NodeType.Element,
            tagName: 'div',
            attributes: {},
            properties: {},
            children: ['3', '4'],
          },

          3: {
            id: '3',
            parentId: '1',
            type: NodeType.Text,
            value: 'foo',
          },

          4: {
            id: '4',
            parentId: '1',
            type: NodeType.Text,
            value: 'bar',
          },
        },
      })
    })
  })
})
