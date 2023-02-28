/**
 * @jest-environment jsdom
 */

import { NodeType, Patch, PatchType } from '@repro/domain'
import { MockNodeList } from '~/utils/testing'
import { getNodeId } from '@repro/vdom-utils'
import { createDOMTreeWalker } from './utils'
import { createDOMVisitor } from './visitor'
import { RecordingOptions } from '../types'
import { internal__processMutationRecords } from './observe'

describe('libs/record: dom observers', () => {
  it('should correctly process an attribute mutation record', () => {
    const patches: Array<Patch> = []

    const target = document.createElement('div')
    target.setAttribute('class', 'foo')

    const records: Array<MutationRecord> = [
      {
        type: 'attributes',
        attributeName: 'class',
        attributeNamespace: null,
        oldValue: null,
        addedNodes: MockNodeList.empty(),
        removedNodes: MockNodeList.empty(),
        target,
        nextSibling: null,
        previousSibling: null,
      },
    ]

    const options: RecordingOptions = {
      types: new Set(['dom']),
      snapshotInterval: 10_000,
      ignoredNodes: [],
      ignoredSelectors: [],
      eventSampling: {
        pointerMove: 50,
        resize: 250,
        scroll: 100,
      },
    }

    const walkDOMTree = createDOMTreeWalker(options)

    const subscriber = (patch: Patch) => {
      patches.push(patch)
    }

    internal__processMutationRecords(records, walkDOMTree, options, subscriber)

    expect(patches).toEqual([
      {
        type: PatchType.Attribute,
        targetId: getNodeId(target),
        name: 'class',
        value: 'foo',
        oldValue: null,
      },
    ])
  })

  it('should correctly process a characterData mutation', () => {
    const patches: Array<Patch> = []

    const target = document.createTextNode('bar')

    const records: Array<MutationRecord> = [
      {
        type: 'characterData',
        attributeName: null,
        attributeNamespace: null,
        oldValue: 'foo',
        addedNodes: MockNodeList.empty(),
        removedNodes: MockNodeList.empty(),
        target,
        nextSibling: null,
        previousSibling: null,
      },
    ]

    const options: RecordingOptions = {
      types: new Set(['dom']),
      snapshotInterval: 10_000,
      ignoredNodes: [],
      ignoredSelectors: [],
      eventSampling: {
        pointerMove: 50,
        resize: 250,
        scroll: 100,
      },
    }

    const walkDOMTree = createDOMTreeWalker(options)

    const subscriber = (patch: Patch) => {
      patches.push(patch)
    }

    internal__processMutationRecords(records, walkDOMTree, options, subscriber)

    expect(patches).toEqual([
      {
        type: PatchType.Text,
        targetId: getNodeId(target),
        value: 'bar',
        oldValue: 'foo',
      },
    ])
  })

  it('should correctly process childList mutation records', () => {
    const patches: Array<Patch> = []

    const target = document.createElement('div')
    const added = document.createElement('div')
    const removed = document.createElement('div')

    const records: Array<MutationRecord> = [
      {
        type: 'childList',
        attributeName: null,
        attributeNamespace: null,
        oldValue: null,
        addedNodes: MockNodeList.from([]),
        removedNodes: MockNodeList.from([removed]),
        target,
        nextSibling: null,
        previousSibling: null,
      },
      {
        type: 'childList',
        attributeName: null,
        attributeNamespace: null,
        oldValue: null,
        addedNodes: MockNodeList.from([added]),
        removedNodes: MockNodeList.from([]),
        target,
        nextSibling: null,
        previousSibling: null,
      },
    ]

    const options: RecordingOptions = {
      types: new Set(['dom']),
      snapshotInterval: 10_000,
      ignoredNodes: [],
      ignoredSelectors: [],
      eventSampling: {
        pointerMove: 50,
        resize: 250,
        scroll: 100,
      },
    }

    const walkDOMTree = createDOMTreeWalker(options)
    walkDOMTree.acceptDOMVisitor(createDOMVisitor())

    const subscriber = (patch: Patch) => {
      patches.push(patch)
    }

    internal__processMutationRecords(records, walkDOMTree, options, subscriber)

    expect(patches).toEqual<Array<Patch>>([
      {
        type: PatchType.RemoveNodes,
        parentId: getNodeId(target),
        previousSiblingId: null,
        nextSiblingId: null,
        nodes: [
          {
            rootId: getNodeId(removed),
            nodes: {
              [getNodeId(removed)]: {
                id: getNodeId(removed),
                parentId: null,
                type: NodeType.Element,
                tagName: 'div',
                attributes: {},
                properties: {
                  checked: null,
                  selectedIndex: null,
                  value: null,
                },
                children: [],
              },
            },
          },
        ],
      },
      {
        type: PatchType.AddNodes,
        parentId: getNodeId(target),
        previousSiblingId: null,
        nextSiblingId: null,
        nodes: [
          {
            rootId: getNodeId(added),
            nodes: {
              [getNodeId(added)]: {
                id: getNodeId(added),
                parentId: null,
                type: NodeType.Element,
                tagName: 'div',
                attributes: {},
                properties: {
                  checked: null,
                  selectedIndex: null,
                  value: null,
                },
                children: [],
              },
            },
          },
        ],
      },
    ])
  })
})
