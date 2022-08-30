import {
  AddNodesPatch,
  AttributePatch,
  NodeType,
  PatchType,
  TextPropertyPatch,
  NumberPropertyPatch,
  BooleanPropertyPatch,
  RemoveNodesPatch,
  TextPatch,
  VDocType,
  VDocument,
  VElement,
  VText,
  VTree,
  createNodeId,
} from '../vdom'

export const documentNode: VDocument = {
  type: NodeType.Document,
  id: createNodeId(),
  parentId: null,
  children: new Array(5).fill(null).map(createNodeId),
}

export const docTypeNode: VDocType = {
  type: NodeType.DocType,
  id: createNodeId(),
  parentId: createNodeId(),
  name: 'html',
  publicId: '-//W3C//DTD XHTML 1.1//EN',
  systemId: 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd',
}

export const elementNode: VElement = {
  type: NodeType.Element,
  id: createNodeId(),
  parentId: createNodeId(),
  tagName: 'div',
  children: new Array(5).fill(null).map(createNodeId),
  attributes: {
    class: 'class-name-1 class-name-2 class-name-3',
    id: 'element-id',
    ['data-custom']: '{"foo": "bar"}',
  },
  properties: {
    value: 'this is a value',
    checked: true,
    selectedIndex: 4,
  },
}

export const textNode: VText = {
  type: NodeType.Text,
  id: createNodeId(),
  parentId: createNodeId(),
  value: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin tristique non felis at pharetra. Donec fringilla enim vel elit scelerisque, nec luctus velit condimentum. Quisque sem enim, efficitur nec ornare vel, vestibulum ac turpis. Vestibulum vel libero feugiat, malesuada mauris sit amet, viverra ante. Proin suscipit est nibh, et mattis libero sodales et. Fusce vel ante ut erat interdum vulputate. In hac habitasse platea dictumst. Nullam facilisis lacus molestie, imperdiet turpis at, condimentum risus.
Nullam vitae luctus nisl. Suspendisse vehicula eget mi eu porta. Donec ac mi dui. Duis nec gravida magna. Proin dolor magna, fermentum tempor cursus id, sagittis in diam. Donec vel laoreet ipsum. Donec venenatis ac purus quis molestie. Praesent dictum felis quis nibh venenatis feugiat. Duis dictum nisi gravida lorem aliquet, eget euismod sapien efficitur.
Ut eu sollicitudin purus, et pharetra arcu. Pellentesque condimentum pretium dolor sit amet facilisis. Sed odio velit, vehicula vitae lacus sit amet, condimentum congue quam. Phasellus in interdum nunc, at imperdiet erat. Cras eu faucibus libero. Duis ante lacus, euismod ut eleifend eget, hendrerit nec massa. Etiam placerat est id imperdiet finibus. Proin ut lobortis risus. Nullam sagittis eros eget eros pretium, eu condimentum metus scelerisque. Quisque convallis lectus a elementum laoreet. Nulla vitae odio dapibus, lacinia ex ut, ullamcorper lorem. Sed porttitor lorem ac est placerat consectetur.
Donec malesuada ipsum mauris, eget bibendum dui faucibus ac. Nunc porttitor, risus vel porttitor condimentum, lacus eros luctus mi, eu volutpat libero diam eget elit. Sed placerat metus at bibendum rhoncus. Vestibulum lacus ex, auctor eu orci nec, congue condimentum ex. Mauris fringilla neque quis felis consequat iaculis. Sed volutpat dolor lorem, ullamcorper sagittis lectus pulvinar sit amet. Aenean rhoncus, lectus eget porttitor sodales, velit ante ultricies ipsum, id porta odio odio ac lacus. Nunc mattis metus vel nisi laoreet pretium. Quisque at libero in enim sagittis imperdiet convallis sed libero.`,
}

export const vtree: VTree = {
  rootId: documentNode.id,
  nodes: {
    [documentNode.id]: documentNode,
    [docTypeNode.id]: docTypeNode,
    [elementNode.id]: elementNode,
    [textNode.id]: textNode,
  },
}

export const attributePatch: AttributePatch = {
  type: PatchType.Attribute,
  targetId: createNodeId(),
  name: 'class',
  value: 'foo',
  oldValue: 'bar',
}

export const textPropertyPatch: TextPropertyPatch = {
  type: PatchType.TextProperty,
  targetId: createNodeId(),
  name: 'value',
  value: 'this is the new value',
  oldValue: '',
}

export const numberPropertyPatch: NumberPropertyPatch = {
  type: PatchType.NumberProperty,
  targetId: createNodeId(),
  name: 'selectedIndex',
  value: 3,
  oldValue: -1,
}

export const booleanPropertyPatch: BooleanPropertyPatch = {
  type: PatchType.BooleanProperty,
  targetId: createNodeId(),
  name: 'checked',
  value: true,
  oldValue: false,
}

export const textPatch: TextPatch = {
  type: PatchType.Text,
  targetId: createNodeId(),
  value: 'foo',
  oldValue: 'bar',
}

export const addNodesPatch: AddNodesPatch = {
  type: PatchType.AddNodes,
  parentId: createNodeId(),
  previousSiblingId: createNodeId(),
  nextSiblingId: null,
  nodes: [vtree, vtree, vtree],
}

export const removeNodesPatch: RemoveNodesPatch = {
  type: PatchType.RemoveNodes,
  parentId: createNodeId(),
  previousSiblingId: createNodeId(),
  nextSiblingId: null,
  nodes: [vtree, vtree, vtree],
}
