import { approxByteLength } from '@repro/typed-binary-encoder'
import {
  ConsoleMessage,
  ConsoleMessageView,
  LogLevel,
  MessagePartType,
} from './console'
import { elementNode } from './fixtures/vdom'

describe('Console codecs', () => {
  it('should create a binary view for a console message', () => {
    const input: ConsoleMessage = {
      level: LogLevel.Info,
      parts: [
        { type: MessagePartType.String, value: 'foo' },
        { type: MessagePartType.Node, node: elementNode },
      ],
      stack: [
        {
          functionName: 'foo',
          fileName: '/path/to/bar.js',
          lineNumber: 1,
          columnNumber: 182134,
        },
        {
          functionName: null,
          fileName: '/path/to/somewhere/else.js',
          lineNumber: 76543,
          columnNumber: 4,
        },
      ],
    }

    const buffer = ConsoleMessageView.encode(input)
    const view = ConsoleMessageView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })
})
