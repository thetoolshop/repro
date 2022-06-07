import { approxByteLength } from '../record/buffer-utils'
import {
  documentNode,
  docTypeNode,
  elementNode,
  textNode,
  attributePatch,
  textPatch,
  addNodesPatch,
  removeNodesPatch,
  numberPropertyPatch,
  textPropertyPatch,
  booleanPropertyPatch,
  vtree,
} from './fixtures/vdom'
import {
  AddNodesPatchView,
  AttributePatchView,
  BooleanPropertyPatchView,
  NumberPropertyPatchView,
  RemoveNodesPatchView,
  TextPatchView,
  TextPropertyPatchView,
  VDocTypeView,
  VDocumentView,
  VElementView,
  VTextView,
  VTreeView,
} from './vdom'

describe('VDOM codec', () => {
  it('should create a binary view for a VDocument node', () => {
    const input = documentNode
    const buffer = VDocumentView.encode(input)
    const view = VDocumentView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a VDocType node', () => {
    const input = docTypeNode
    const buffer = VDocTypeView.encode(input)
    const view = VDocTypeView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a VElement node', () => {
    const input = elementNode
    const buffer = VElementView.encode(input)
    const view = VElementView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a VText node', () => {
    const input = textNode
    const buffer = VTextView.encode(input)
    const view = VTextView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a VTree', () => {
    const input = vtree
    const buffer = VTreeView.encode(input)
    const view = VTreeView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for an attribute patch', () => {
    const input = attributePatch
    const buffer = AttributePatchView.encode(input)
    const view = AttributePatchView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a text patch', () => {
    const input = textPatch
    const buffer = TextPatchView.encode(input)
    const view = TextPatchView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for an add-nodes patch', () => {
    const input = addNodesPatch
    const buffer = AddNodesPatchView.encode(input)
    const view = AddNodesPatchView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a remove-nodes patch', () => {
    const input = removeNodesPatch
    const buffer = RemoveNodesPatchView.encode(input)
    const view = RemoveNodesPatchView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a text property patch', () => {
    const input = textPropertyPatch
    const buffer = TextPropertyPatchView.encode(input)
    const view = TextPropertyPatchView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a number property patch', () => {
    const input = numberPropertyPatch
    const buffer = NumberPropertyPatchView.encode(input)
    const view = NumberPropertyPatchView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })

  it('should create a binary view for a boolean property patch', () => {
    const input = booleanPropertyPatch
    const buffer = BooleanPropertyPatchView.encode(input)
    const view = BooleanPropertyPatchView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })
})
