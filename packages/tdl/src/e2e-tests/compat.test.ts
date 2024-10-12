import ts from 'typescript'
import { compile } from '../cli/compiler'
import { buildAST } from '../cli/parser/buildAST'

async function interpret(source: string) {
  const ast = buildAST(source)
  const tsOutput = await compile(ast)

  const jsOutput = ts.transpileModule(tsOutput, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
    renamedDependencies: {
      '@repro/tdl': '../'
    }
  })

  return eval(jsOutput.outputText)
}

describe('Compatibility', () => {
  it('should be backwards-compatible when a new property is added to a struct', async () => {
    const VersionA = await interpret(`
      type MyStruct: struct {
        0) foo: uint8
        1) bar: map<string, string>
      }
    `)

    const dataView = VersionA.encode({
      foo: 128,
      bar: {
        a: 'a',
        b: 'b',
      },
    })

    const VersionB = await interpret(`
      type MyStruct: struct {
        0) foo: uint8
        1) bar: map<string, string>
        2) baz: vector<int8>
      }
    `)

    expect(VersionB.decode(dataView)).toEqual({
      foo: 128,
      bar: {
        a: 'a',
        b: 'b',
      },
      baz: [],
    })

    expect(VersionB.over(dataView)).toEqual({
      foo: 128,
      bar: {
        a: 'a',
        b: 'b',
      },
      baz: [],
    })
  })

  it('should be forwards-compatible when a new property is added to a struct', async () => {
    const VersionA = await interpret(`
      type MyStruct: struct {
        0) foo: uint8
        1) bar: map<string, string>
      }
    `)

    const VersionB = await interpret(`
      type MyStruct: struct {
        0) foo: uint8
        1) bar: map<string, string>
        2) baz: vector<int8>
      }
    `)

    const dataView = VersionB.encode({
      foo: 128,
      bar: {
        a: 'a',
        b: 'b',
      },
      baz: [1, 2, 3]
    })

    expect(VersionA.decode(dataView)).toEqual({
      foo: 128,
      bar: {
        a: 'a',
        b: 'b',
      },
    })

    expect(VersionA.over(dataView)).toEqual({
      foo: 128,
      bar: {
        a: 'a',
        b: 'b',
      },
    })
  })
})
