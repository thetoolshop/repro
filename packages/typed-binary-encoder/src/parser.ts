import fs from 'fs/promises'
import ohm from 'ohm-js'
import path from 'path'

export async function main() {
  const grammarText = await fs.readFile(path.join(__dirname, 'grammar.ohm'), {
    encoding: 'utf-8',
  })

  const grammar = ohm.grammar(grammarText)
  const semantics = grammar.createSemantics()

  semantics.addOperation('generateCode', {})

  const input = ''

  semantics(grammar.match(input)).generateCode()
}

if (require.main === module) {
  main()
}
