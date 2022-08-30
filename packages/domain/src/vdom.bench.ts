import { approxByteLength } from '@repro/typed-binary-encoder'
import { stress } from './bench-utils'
import {
  AddNodesPatchView,
  AttributePatchView,
  RemoveNodesPatchView,
  TextPatchView,
  VDocTypeView,
  VDocumentView,
  VElementView,
  VTextView,
  VTreeView,
} from './vdom'
import {
  documentNode,
  docTypeNode,
  elementNode,
  textNode,
  vtree,
  attributePatch,
  textPatch,
  addNodesPatch,
  removeNodesPatch,
} from './fixtures/vdom'

const documentBuffer = VDocumentView.encode(documentNode)
const docTypeBuffer = VDocTypeView.encode(docTypeNode)
const elementBuffer = VElementView.encode(elementNode)
const textBuffer = VTextView.encode(textNode)
const vtreeBuffer = VTreeView.encode(vtree)
const attributePatchBuffer = AttributePatchView.encode(attributePatch)
const textPatchBuffer = TextPatchView.encode(textPatch)
const addNodesPatchBuffer = AddNodesPatchView.encode(addNodesPatch)
const removeNodesPatchBuffer = RemoveNodesPatchView.encode(removeNodesPatch)

console.table({
  VDocument: {
    raw: approxByteLength(documentNode),
    binary: approxByteLength(VDocumentView.encode(documentNode)),
    perf_encode: stress(() => VDocumentView.encode(documentNode)),
    perf_decode: stress(() => VDocumentView.decode(documentBuffer)),
  },

  VDocType: {
    raw: approxByteLength(docTypeNode),
    binary: approxByteLength(VDocTypeView.encode(docTypeNode)),
    perf_encode: stress(() => VDocTypeView.encode(docTypeNode)),
    perf_decode: stress(() => VDocTypeView.decode(docTypeBuffer)),
  },

  VElement: {
    raw: approxByteLength(elementNode),
    binary: approxByteLength(VElementView.encode(elementNode)),
    perf_encode: stress(() => VElementView.encode(elementNode)),
    perf_decode: stress(() => VElementView.decode(elementBuffer)),
  },

  VText: {
    raw: approxByteLength(textNode),
    binary: approxByteLength(VTextView.encode(textNode)),
    perf_encode: stress(() => VTextView.encode(textNode)),
    perf_decode: stress(() => VTextView.decode(textBuffer)),
  },

  VTree: {
    raw: approxByteLength(vtree),
    binary: approxByteLength(VTreeView.encode(vtree)),
    perf_encode: stress(() => VTreeView.encode(vtree)),
    perf_decode: stress(() => VTreeView.decode(vtreeBuffer)),
  },

  AttributePatch: {
    raw: approxByteLength(attributePatch),
    binary: approxByteLength(AttributePatchView.encode(attributePatch)),
    perf_encode: stress(() => AttributePatchView.encode(attributePatch)),
    perf_decode: stress(() => AttributePatchView.decode(attributePatchBuffer)),
  },

  TextPatch: {
    raw: approxByteLength(textPatch),
    binary: approxByteLength(TextPatchView.encode(textPatch)),
    perf_encode: stress(() => TextPatchView.encode(textPatch)),
    perf_decode: stress(() => TextPatchView.decode(textPatchBuffer)),
  },

  AddNodesPatch: {
    raw: approxByteLength(addNodesPatch),
    binary: approxByteLength(AddNodesPatchView.encode(addNodesPatch)),
    perf_encode: stress(() => AddNodesPatchView.encode(addNodesPatch)),
    perf_decode: stress(() => AddNodesPatchView.decode(addNodesPatchBuffer)),
  },

  RemoveNodesPatch: {
    raw: approxByteLength(removeNodesPatch),
    binary: approxByteLength(RemoveNodesPatchView.encode(removeNodesPatch)),
    perf_encode: stress(() => RemoveNodesPatchView.encode(removeNodesPatch)),
    perf_decode: stress(() =>
      RemoveNodesPatchView.decode(removeNodesPatchBuffer)
    ),
  },
})
