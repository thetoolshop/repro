import { Immutable } from '~/types/extensions'
import {
  NodeType,
  Patch,
  PatchType,
  SyntheticId,
  VText,
  VTree,
} from '@repro/domain'
import {
  isInputElement,
  isSelectElement,
  isTextAreaElement,
  maskValue,
} from '~/utils/dom'
import { createEventObserver, ObserverLike } from '~/utils/observer'
import { createSyntheticId, getNodeId, isElementVNode } from '~/utils/vdom'
import { RecordingOptions } from '../types'
import { DOMTreeWalker, isIgnoredByNode, isIgnoredBySelector } from './utils'

export function createDOMObserver(
  walkDOMTree: DOMTreeWalker,
  options: RecordingOptions,
  subscriber: (patch: Patch) => void
): ObserverLike {
  const domObserver = createMutationObserver(walkDOMTree, options, subscriber)
  const styleSheetObserver = createStyleSheetObserver(subscriber)
  const inputObserver = createInputObserver(subscriber)

  return {
    disconnect() {
      domObserver.disconnect()
      styleSheetObserver.disconnect()
      inputObserver.disconnect()
    },

    observe(doc, vtree) {
      domObserver.observe(doc, vtree)
      styleSheetObserver.observe(doc, vtree)
      inputObserver.observe(doc, vtree)
    },
  }
}

function createInputObserver(
  subscriber: (patch: Patch) => void
): ObserverLike<Document> {
  let prevChangeMap = new WeakMap<EventTarget, string>()
  let prevCheckedMap = new WeakMap<EventTarget, boolean>()
  let prevSelectedIndexMap = new WeakMap<EventTarget, number>()
  let maskedInputs = new WeakSet<EventTarget>()

  const handleChangeOrInput = (evt: Event) => {
    const eventTarget = evt.target as Node
    const isInput = isInputElement(eventTarget)
    const isTextArea = isTextAreaElement(eventTarget)
    const isSelect = isSelectElement(eventTarget)

    if (isInput || isTextArea || isSelect) {
      // TODO: read prev value from vtree
      let oldValue =
        prevChangeMap.get(eventTarget) ||
        ('defaultValue' in eventTarget ? eventTarget.defaultValue : '')

      let value = eventTarget.value

      if (eventTarget.type === 'password') {
        maskedInputs.add(eventTarget)
      }

      if (maskedInputs.has(eventTarget)) {
        oldValue = maskValue(oldValue)
        value = maskValue(value)
      }

      if (eventTarget.value !== oldValue) {
        subscriber({
          type: PatchType.TextProperty,
          targetId: getNodeId(eventTarget),
          name: 'value',
          value,
          oldValue,
        })

        prevChangeMap.set(eventTarget, value)
      }
    }

    if (isInput) {
      const inputType = eventTarget.type

      if (inputType === 'checkbox' || inputType === 'radio') {
        // TODO: read prev checked state from vtree
        const prevChecked = prevCheckedMap.get(eventTarget) || false

        subscriber({
          type: PatchType.BooleanProperty,
          targetId: getNodeId(eventTarget),
          name: 'checked',
          value: eventTarget.checked,
          oldValue: prevChecked,
        })

        prevCheckedMap.set(eventTarget, eventTarget.checked)
      }

      if (inputType === 'radio') {
        if (eventTarget.parentElement) {
          const siblingInputs = eventTarget.parentElement.querySelectorAll(
            `input[type="radio"][name="${eventTarget.name}"]`
          )

          for (const sibling of Array.from(siblingInputs)) {
            if (sibling !== eventTarget) {
              const prevChecked = prevCheckedMap.get(sibling) || false

              subscriber({
                type: PatchType.BooleanProperty,
                targetId: getNodeId(sibling),
                name: 'checked',
                value: false,
                oldValue: prevChecked,
              })

              prevCheckedMap.set(sibling, false)
            }
          }
        }
      }
    }

    if (isSelect) {
      // TODO: read previous selected index from vtree
      const prevSelectedIndex = prevSelectedIndexMap.get(eventTarget) || -1

      subscriber({
        type: PatchType.NumberProperty,
        targetId: getNodeId(eventTarget),
        name: 'selectedIndex',
        value: eventTarget.selectedIndex,
        oldValue: prevSelectedIndex,
      })

      prevSelectedIndexMap.set(eventTarget, eventTarget.selectedIndex)
    }
  }

  // const changeObserver = createEventObserver('change', handleChangeOrInput)
  const inputObserver = createEventObserver('input', handleChangeOrInput)

  const propertyOverrides = [
    [HTMLInputElement.prototype, 'value'],
    [HTMLInputElement.prototype, 'checked'],
    [HTMLSelectElement.prototype, 'value'],
    [HTMLTextAreaElement.prototype, 'value'],
    [HTMLSelectElement.prototype, 'selectedIndex'],
  ] as const

  const originalPropertyDescriptors = propertyOverrides.map(([obj, name]) =>
    Object.getOwnPropertyDescriptor(obj, name)
  )

  return {
    disconnect() {
      propertyOverrides.forEach(([obj, name], i) => {
        const descriptor = originalPropertyDescriptors[i]

        if (descriptor) {
          Object.defineProperty(obj, name, descriptor)
        }

        // @ts-ignore
        delete obj[`__original__${name}`]
      })

      // changeObserver.disconnect()
      inputObserver.disconnect()

      prevChangeMap = new WeakMap()
      prevCheckedMap = new WeakMap()
      prevSelectedIndexMap = new WeakMap()
    },

    observe(doc, vtree) {
      // TODO: make vtree available to enclosing scope
      // changeObserver.observe(doc, vtree)
      inputObserver.observe(doc, vtree)

      propertyOverrides.forEach(([obj, name], i) => {
        const descriptor = originalPropertyDescriptors[i]

        if (descriptor) {
          Object.defineProperty(obj, `__original__${name}`, descriptor)
        }

        Object.defineProperty(obj, name, {
          set(value: any) {
            if (descriptor && descriptor.set) {
              descriptor.set.call(this, value)
            }

            handleChangeOrInput({ target: this } as Event)
          },
        })
      })
    },
  }
}

export function internal__processMutationRecords(
  records: Array<MutationRecord>,
  walkDOMTree: DOMTreeWalker,
  options: RecordingOptions,
  subscriber: (patch: Patch) => void
) {
  const patches: Array<Patch> = []
  const addedNodes = new Set<SyntheticId>()

  for (const record of records) {
    if (isIgnoredByNode(record.target, options.ignoredNodes)) {
      continue
    }

    if (isIgnoredBySelector(record.target, options.ignoredSelectors)) {
      continue
    }

    switch (record.type) {
      case 'attributes':
        const name = record.attributeName as string
        const attribute = (record.target as Element).attributes.getNamedItem(
          name
        )

        patches.push({
          type: PatchType.Attribute,
          targetId: getNodeId(record.target),
          name,
          value: attribute ? attribute.value : null,
          oldValue: record.oldValue,
        })

        break

      case 'characterData':
        patches.push({
          type: PatchType.Text,
          targetId: getNodeId(record.target),
          value: (record.target as Text).data,
          oldValue: record.oldValue || '',
        })

        break

      case 'childList':
        // TODO: optimization - handle moving nodes without destroying vnode
        const removedVTrees = Array.from(record.removedNodes)
          .filter(node => !isIgnoredBySelector(node, options.ignoredSelectors))
          .filter(node => !isIgnoredByNode(node, options.ignoredNodes))
          .map(node => walkDOMTree(node))
          .filter(vtree => vtree !== null) as Array<VTree>

        const addedVTrees = Array.from(record.addedNodes)
          .filter(node => !isIgnoredBySelector(node, options.ignoredSelectors))
          .filter(node => !isIgnoredByNode(node, options.ignoredNodes))
          .map(node => walkDOMTree(node))
          .filter(vtree => vtree !== null) as Array<VTree>

        let previousSibling = record.previousSibling

        while (
          previousSibling &&
          (isIgnoredBySelector(previousSibling, options.ignoredSelectors) ||
            isIgnoredByNode(previousSibling, options.ignoredNodes))
        ) {
          previousSibling = previousSibling.previousSibling
        }

        let nextSibling = record.nextSibling

        while (
          nextSibling &&
          (isIgnoredBySelector(nextSibling, options.ignoredSelectors) ||
            isIgnoredByNode(nextSibling, options.ignoredNodes))
        ) {
          nextSibling = record.nextSibling
        }

        if (removedVTrees.length) {
          for (const vtree of removedVTrees) {
            for (const nodeId of Object.keys(vtree.nodes)) {
              addedNodes.delete(nodeId)
            }
          }

          patches.push({
            type: PatchType.RemoveNodes,
            parentId: getNodeId(record.target),
            previousSiblingId:
              previousSibling !== null ? getNodeId(previousSibling) : null,
            nextSiblingId: nextSibling !== null ? getNodeId(nextSibling) : null,
            nodes: removedVTrees,
          })
        }

        if (addedVTrees.length) {
          outer: {
            for (const vtree of addedVTrees) {
              if (addedNodes.has(vtree.rootId)) {
                break outer
              }
            }

            for (const vtree of addedVTrees) {
              for (const nodeId of Object.keys(vtree.nodes)) {
                addedNodes.add(nodeId)
              }
            }

            patches.push({
              type: PatchType.AddNodes,
              parentId: getNodeId(record.target),
              previousSiblingId:
                previousSibling !== null ? getNodeId(previousSibling) : null,
              nextSiblingId:
                nextSibling !== null ? getNodeId(nextSibling) : null,
              nodes: addedVTrees,
            })
          }
        }

        break
    }
  }

  for (const patch of patches) {
    subscriber(patch)
  }
}

function createMutationObserver(
  walkDOMTree: DOMTreeWalker,
  options: RecordingOptions,
  subscriber: (patch: Patch) => void
): ObserverLike<Document> {
  const domObserver = new MutationObserver(records => {
    internal__processMutationRecords(records, walkDOMTree, options, subscriber)
  })

  return {
    disconnect: () => domObserver.disconnect(),
    observe(doc) {
      domObserver.observe(doc, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        characterDataOldValue: true,
      })
    },
  }
}

function createStyleSheetObserver(
  subscriber: (patch: Patch) => void
): ObserverLike<Document> {
  function insertRuleEffect(
    vtree: Immutable<VTree>,
    sheet: CSSStyleSheet,
    rule: string,
    index: number = 0
  ) {
    if (sheet.ownerNode) {
      const parentId = getNodeId(sheet.ownerNode)
      const parentVNode = vtree.nodes[parentId]

      if (parentVNode && isElementVNode(parentVNode)) {
        const previousSiblingId = parentVNode.children[index - 1] || null
        const nextSiblingId = parentVNode.children[index] || null
        const id = createSyntheticId()

        subscriber({
          type: PatchType.AddNodes,
          parentId,
          previousSiblingId,
          nextSiblingId,
          nodes: [
            {
              rootId: id,
              nodes: {
                [id]: {
                  type: NodeType.Text,
                  id,
                  parentId,
                  value: rule,
                },
              },
            },
          ],
        })
      }
    }
  }

  function deleteRuleEffect(
    vtree: Immutable<VTree>,
    sheet: CSSStyleSheet,
    index: number
  ) {
    if (sheet.ownerNode) {
      const parentId = getNodeId(sheet.ownerNode)
      const parentVNode = vtree.nodes[parentId]

      if (parentVNode && isElementVNode(parentVNode)) {
        const previousSiblingId = parentVNode.children[index - 1] || null
        const nextSiblingId = parentVNode.children[index + 1] || null
        const id = parentVNode.children[index]

        if (id) {
          const node = vtree.nodes[id]

          if (node) {
            subscriber({
              type: PatchType.RemoveNodes,
              parentId,
              previousSiblingId,
              nextSiblingId,
              nodes: [
                {
                  rootId: id,
                  nodes: {
                    [id]: node as VText,
                  },
                },
              ],
            })
          }
        }
      }
    }
  }

  const insertRule = window.CSSStyleSheet.prototype.insertRule
  const deleteRule = window.CSSStyleSheet.prototype.deleteRule

  const targets = new Set<Window & typeof globalThis>()

  return {
    disconnect() {
      for (const win of targets) {
        win.CSSStyleSheet.prototype.insertRule = insertRule
        win.CSSStyleSheet.prototype.deleteRule = deleteRule
      }
    },

    observe(doc, vtree) {
      const win = doc.defaultView

      if (win) {
        targets.add(win)

        win.CSSStyleSheet.prototype.insertRule = function (this, ...args) {
          insertRuleEffect(vtree, this, ...args)
          return insertRule.call(this, ...args)
        }

        win.CSSStyleSheet.prototype.deleteRule = function (this, ...args) {
          deleteRuleEffect(vtree, this, ...args)
          return deleteRule.call(this, ...args)
        }
      }
    },
  }
}
