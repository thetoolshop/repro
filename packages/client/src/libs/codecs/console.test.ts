import { ConsoleMessage, LogLevel, MessagePartType } from '@/types/console'
import { createSyntheticId } from '@/utils/vdom'
import { BufferReader } from 'arraybuffer-utils'
import { approxByteLength } from '../record/buffer-utils'
import { LITTLE_ENDIAN } from './common'
import { decodeConsoleMessage, encodeConsoleMessage } from './console'

describe('Console codecs', () => {
  it('should encode and decode a console message', () => {
    const input: ConsoleMessage = {
      level: LogLevel.Info,
      parts: [
        { type: MessagePartType.String, value: 'foo' },
        { type: MessagePartType.Node, nodeId: createSyntheticId() },
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

    const buffer = encodeConsoleMessage(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeConsoleMessage(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })
})
