import {
  ArrayTypeNode,
  AssignmentNode,
  ASTNodeType,
  BooleanLiteralTypeNode,
  BooleanTypeNode,
  BufferTypeNode,
  CharTypeNode,
  EnumLiteralTypeNode,
  FloatTypeNode,
  IntegerTypeNode,
  MapTypeNode,
  OptionNode,
  ReferenceNode,
  StringTypeNode,
  StructTypeNode,
  TimestampTypeNode,
  TypeNode,
  UnionTypeNode,
  UUIDTypeNode,
  VectorTypeNode,
} from '../parser/ASTTypes'

function range(start: number, end: number) {
  return Array.from({ length: end - start }, (_, i) => i + start)
}

export function generateIntegerSchema(node: IntegerTypeNode) {
  if (node.bytes === 8) {
    return generateBigIntSchema(node)
  }

  const umax = 2 ** (node.bytes * 8)
  const max = node.signed ? umax / 2 - 1 : umax - 1
  const min = node.signed ? -umax / 2 : 0
  return `z.number().int().min(${min}).max(${max})`
}

export function generateBigIntSchema(node: IntegerTypeNode) {
  const umax = BigInt(2 ** 64)
  const max = node.signed ? umax / 2n - 1n : umax - 1n
  const min = node.signed ? -umax / 2n : 0n
  return `z.bigint().min(${min}).max(${max})`
}

export function generateFloatSchema(_: FloatTypeNode) {
  // TODO: clarify min/max safe values for IEEE 754 binary32 and binary64
  return `z.number()`
}

export function generateCharSchema(node: CharTypeNode) {
  return `z.string().length(${node.bytes})`
}

export function generateStringSchema(_: StringTypeNode) {
  return `z.string()`
}

export function generateUUIDSchema(_: UUIDTypeNode) {
  return `z.string().uuid()`
}

export function generateTimestampSchema(_: TimestampTypeNode) {
  return `z.string().datetime()`
}

export function generateBooleanSchema(_: BooleanTypeNode) {
  return `z.boolean()`
}

export function generateBooleanLiteralSchema(node: BooleanLiteralTypeNode) {
  return `z.literal(${node.value})`
}

export function generateBufferSchema(_: BufferTypeNode) {
  return `z.instanceof(ArrayBuffer)`
}

export function generateEnumLiteralSchema(node: EnumLiteralTypeNode) {
  return `z.literal(${node.reference.name}.${node.enumProperty})`
}

export function generateArraySchema(node: ArrayTypeNode): string {
  const elementSchema = generateSchema(node.elementType)
  return `z.tuple([${range(0, node.size)
    .map(() => elementSchema)
    .join(', ')}])`
}

export function generateVectorSchema(node: VectorTypeNode): string {
  return `z.array(${generateSchema(node.elementType)})`
}

export function generateMapSchema(node: MapTypeNode): string {
  return `z.record(${generateSchema(node.keyType)}, ${generateSchema(
    node.valueType
  )})`
}

export function generateStructSchema(node: StructTypeNode): string {
  return `z.object({
    ${node.properties
      .map(property => `${property.name}: ${generateSchema(property.value)}`)
      .join(',\n')}
  })`
}

export function generateUnionSchema(node: UnionTypeNode): string {
  return `z.discriminatedUnion('${node.tagField}', [
    ${node.references.map(generateReferenceSchema).join(',\n')}
  ])`
}

export function generateReferenceSchema(node: ReferenceNode) {
  return `${node.name}Schema`
}

export function generateSchema(node: TypeNode | OptionNode | ReferenceNode) {
  const valueNode = node.type === ASTNodeType.Option ? node.value : node
  let valueSchema = ''

  switch (valueNode.type) {
    case ASTNodeType.IntegerType:
      valueSchema = generateIntegerSchema(valueNode)
      break

    case ASTNodeType.FloatType:
      valueSchema = generateFloatSchema(valueNode)
      break

    case ASTNodeType.CharType:
      valueSchema = generateCharSchema(valueNode)
      break

    case ASTNodeType.StringType:
      valueSchema = generateStringSchema(valueNode)
      break

    case ASTNodeType.UUIDType:
      valueSchema = generateUUIDSchema(valueNode)
      break

    case ASTNodeType.TimestampType:
      valueSchema = generateTimestampSchema(valueNode)
      break

    case ASTNodeType.BooleanType:
      valueSchema = generateBooleanSchema(valueNode)
      break

    case ASTNodeType.BooleanLiteralType:
      valueSchema = generateBooleanLiteralSchema(valueNode)
      break

    case ASTNodeType.BufferType:
      valueSchema = generateBufferSchema(valueNode)
      break

    case ASTNodeType.EnumLiteralType:
      valueSchema = generateEnumLiteralSchema(valueNode)
      break

    case ASTNodeType.ArrayType:
      valueSchema = generateArraySchema(valueNode)
      break

    case ASTNodeType.VectorType:
      valueSchema = generateVectorSchema(valueNode)
      break

    case ASTNodeType.MapType:
      valueSchema = generateMapSchema(valueNode)
      break

    case ASTNodeType.StructType:
      valueSchema = generateStructSchema(valueNode)
      break

    case ASTNodeType.UnionType:
      valueSchema = generateUnionSchema(valueNode)
      break

    case ASTNodeType.Reference:
      valueSchema = generateReferenceSchema(valueNode)
      break

    default:
      throw new Error(`Unknown type: ${valueNode.type}`)
  }

  if (valueSchema && node.type === ASTNodeType.Option) {
    valueSchema = `${valueSchema}.nullable()`
  }

  return valueSchema
}

export function generateAssignment(node: AssignmentNode) {
  if (node.value.type === ASTNodeType.EnumType) {
    return `export const ${node.name}Schema = z.nativeEnum(${node.name})`
  }

  return `export const ${node.name}Schema = ${generateSchema(node.value)}`
}
