import {
  AnyDescriptor,
  ArrayDescriptor,
  BooleanDescriptor,
  BufferDescriptor,
  CharDescriptor,
  DictDescriptor,
  IntegerDescriptor,
  StringDescriptor,
  StructDescriptor,
  UnionDescriptor,
  VectorDescriptor,
  createView,
  encodeProperty,
  getProperty,
} from './encoding'

describe('utils: buffer descriptors', () => {
  describe('integer', () => {
    it.each<[IntegerDescriptor, number]>([
      [{ type: 'integer', signed: false, bits: 8 }, 64],
      [{ type: 'integer', signed: true, bits: 8 }, 64],
      [{ type: 'integer', signed: false, bits: 16 }, 4096],
      [{ type: 'integer', signed: true, bits: 16 }, 4096],
      [{ type: 'integer', signed: false, bits: 32 }, 16777216],
      [{ type: 'integer', signed: true, bits: 32 }, 16777216],
    ])('should encode and decode', (descriptor, input) => {
      const dataView = encodeProperty(descriptor, input)
      const lazy = getProperty(descriptor, dataView, true)
      const decoded = getProperty(descriptor, dataView, false)
      expect(lazy).toEqual(input)
      expect(decoded).toEqual(input)
    })
  })

  describe('char', () => {
    it.each<[CharDescriptor, string]>([
      [{ type: 'char', bytes: 1 }, 'a'],
      [{ type: 'char', bytes: 8 }, 'abcdefgh'],
    ])('should encode and decode', (descriptor, input) => {
      const dataView = encodeProperty(descriptor, input)
      const lazy = getProperty(descriptor, dataView, true)
      const decoded = getProperty(descriptor, dataView, false)
      expect(lazy).toEqual(input)
      expect(decoded).toEqual(input)
    })
  })

  describe('string', () => {
    it.each<[StringDescriptor, string]>([
      [{ type: 'string' }, 'foo bar baz'],
      [{ type: 'string' }, ''],
    ])('should encode and decode', (descriptor, input) => {
      const dataView = encodeProperty(descriptor, input)
      const lazy = getProperty(descriptor, dataView, true)
      const decoded = getProperty(descriptor, dataView, false)
      expect(lazy).toEqual(input)
      expect(decoded).toEqual(input)
    })
  })

  describe('bool', () => {
    it.each<[BooleanDescriptor, boolean]>([
      [{ type: 'bool' }, true],
      [{ type: 'bool' }, false],
    ])('should encode and decode', (descriptor, input) => {
      const dataView = encodeProperty(descriptor, input)
      const lazy = getProperty(descriptor, dataView, true)
      const decoded = getProperty(descriptor, dataView, false)
      expect(lazy).toEqual(input)
      expect(decoded).toEqual(input)
    })
  })

  describe('buffer', () => {
    it.each<[BufferDescriptor, ArrayBufferLike]>([
      [{ type: 'buffer' }, new Uint8Array([1, 2, 3, 4]).buffer],
    ])('should encode and decode', (descriptor, input) => {
      const dataView = encodeProperty(descriptor, input)
      const lazy = getProperty(descriptor, dataView, true)
      const decoded = getProperty(descriptor, dataView, false)
      expect(lazy).toEqual(input)
      expect(decoded).toEqual(input)
    })
  })

  describe('struct', () => {
    it.each<[StructDescriptor, object]>([
      [
        {
          type: 'struct',
          fields: [
            ['a', { type: 'integer', signed: false, bits: 8 }],
            ['b', { type: 'integer', signed: true, bits: 32 }],
            ['c', { type: 'char', bytes: 16 }],
            ['d', { type: 'string' }],
            ['e', { type: 'bool' }],
            [
              'f',
              {
                type: 'struct',
                fields: [
                  ['f1', { type: 'integer', signed: false, bits: 32 }],
                  [
                    'f2',
                    {
                      type: 'struct',
                      fields: [['f2a', { type: 'char', bytes: 4 }]],
                    },
                  ],
                ],
              },
            ],
            ['g', { type: 'vector', items: { type: 'char', bytes: 5 } }],
          ],
        },
        {
          a: 64,
          b: -100000,
          c: '0123456789abcdef',
          d: 'lorem ipsum sit dolor',
          e: false,
          f: {
            f1: 250000,
            f2: {
              f2a: '1234',
            },
          },
          g: ['12345', 'vwxyz', '67890'],
        },
      ],
      [
        {
          type: 'struct',
          fields: [
            ['a', { type: 'vector', items: { type: 'char', bytes: 5 } }],
          ],
        },
        { a: ['12345', 'abcde', '67890'] },
      ],
      [
        {
          type: 'struct',
          fields: [
            [
              'a',
              { type: 'array', size: 3, items: { type: 'char', bytes: 5 } },
            ],
          ],
        },
        { a: ['12345', 'abcde', '67890'] },
      ],
    ])('should encode and decode', (descriptor, input) => {
      const dataView = encodeProperty(descriptor, input)
      const lazy = getProperty(descriptor, dataView, true)
      const decoded = getProperty(descriptor, dataView, false)
      expect(lazy).toEqual(input)
      expect(decoded).toEqual(input)
    })

    it('should set value for fixed-length properties', () => {
      const input = {
        a: 1,
        b: 'foo',
        c: true,
        d: [100, 200],
      }

      const descriptor: AnyDescriptor = {
        type: 'struct',
        fields: [
          ['a', { type: 'integer', signed: false, bits: 8 }],
          ['b', { type: 'char', bytes: 3 }],
          ['c', { type: 'bool' }],
          [
            'd',
            {
              type: 'array',
              size: 2,
              items: { type: 'integer', signed: false, bits: 32 },
            },
          ],
        ],
      }

      const view = encodeProperty(descriptor, input)
      const lens = getProperty(descriptor, view)

      lens.a = 64
      lens.b = 'bar'
      lens.c = false
      lens.d = [123456, 789123]

      const decoded = getProperty(descriptor, view, false)

      expect(decoded).toEqual({
        a: 64,
        b: 'bar',
        c: false,
        d: [123456, 789123],
      })
    })

    it('should fail to set a value for a nullable property', () => {
      const input = {
        foo: 'bar',
      }

      const descriptor: AnyDescriptor = {
        type: 'struct',
        fields: [['foo', { type: 'char', bytes: 3, nullable: true }]],
      }

      const view = encodeProperty(descriptor, input)
      const lens = getProperty(descriptor, view)

      expect(() => {
        lens.foo = 'baz'
      }).toThrow()
    })

    it('should fail to set a value for a variable-length property', () => {
      const input = {
        foo: 'bar',
      }

      const descriptor: AnyDescriptor = {
        type: 'struct',
        fields: [['foo', { type: 'string' }]],
      }

      const view = encodeProperty(descriptor, input)
      const lens = getProperty(descriptor, view)

      expect(() => {
        lens.foo = 'baz'
      }).toThrow()
    })
  })

  describe('array', () => {
    it.each<[ArrayDescriptor, Array<any>]>([
      [
        {
          type: 'array',
          size: 2,
          items: { type: 'integer', signed: false, bits: 16 },
        },
        [1024, 1024],
      ],
    ])('should encode and decode', (descriptor, input) => {
      const dataView = encodeProperty(descriptor, input)
      const lazy = getProperty(descriptor, dataView, true)
      const decoded = getProperty(descriptor, dataView, false)
      expect(lazy).toEqual(input)
      expect(decoded).toEqual(input)
    })
  })

  describe('vector', () => {
    it.each<[VectorDescriptor, Array<any>]>([
      [
        { type: 'vector', items: { type: 'integer', signed: false, bits: 8 } },
        [64, 128],
      ],
      [
        { type: 'vector', items: { type: 'char', bytes: 5 } },
        ['abcde', '12345', 'vwxyz', '67890'],
      ],
      [
        {
          type: 'vector',
          items: {
            type: 'union',
            tagField: 'tag',
            descriptors: {
              0: {
                type: 'struct',
                fields: [
                  ['tag', { type: 'integer', signed: false, bits: 8 }],
                  ['foo', { type: 'string' }],
                ],
              },

              1: {
                type: 'struct',
                fields: [
                  ['tag', { type: 'integer', signed: false, bits: 8 }],
                  ['bar', { type: 'char', bytes: 5 }],
                ],
              },
            },
          },
        },
        [
          { tag: 0, foo: 'bar' },
          { tag: 1, bar: 'abcde' },
        ],
      ],
    ])('should encode and decode', (descriptor, input) => {
      const dataView = encodeProperty(descriptor, input)
      const lazy = getProperty(descriptor, dataView, true)
      const decoded = getProperty(descriptor, dataView, false)
      expect(lazy).toEqual(input)
      expect(decoded).toEqual(input)
    })
  })

  describe('dict', () => {
    it.each<[DictDescriptor, object]>([
      [
        {
          type: 'dict',
          key: { type: 'char', bytes: 4 },
          value: {
            type: 'union',
            tagField: 'type',
            descriptors: {
              0: {
                type: 'struct',
                fields: [
                  ['type', { type: 'integer', signed: false, bits: 8 }],
                  ['foo', { type: 'integer', signed: false, bits: 8 }],
                ],
              },

              1: {
                type: 'struct',
                fields: [
                  ['type', { type: 'integer', signed: false, bits: 8 }],
                  ['bar', { type: 'char', bytes: 2 }],
                ],
              },
            },
          },
        },
        { abcd: { type: 0, foo: 128 }, efgh: { type: 1, bar: 'ab' } },
      ],
    ])('should encode and decode', (descriptor, input) => {
      const dataView = encodeProperty(descriptor, input)
      const lazy = getProperty(descriptor, dataView, true)
      const decoded = getProperty(descriptor, dataView, false)
      expect(lazy).toEqual(input)
      expect(decoded).toEqual(input)
    })
  })

  describe('union', () => {
    it.each<[UnionDescriptor, any]>([
      [
        {
          type: 'union',
          tagField: 'type',
          descriptors: {
            0: {
              type: 'struct',
              fields: [
                ['type', { type: 'integer', signed: false, bits: 8 }],
                ['foo', { type: 'integer', signed: false, bits: 8 }],
              ],
            },

            1: {
              type: 'struct',
              fields: [
                ['type', { type: 'integer', signed: false, bits: 8 }],
                ['bar', { type: 'char', bytes: 2 }],
              ],
            },
          },
        },
        { type: 1, bar: 'ab' },
      ],
    ])('should encode and decode', (descriptor, input) => {
      const dataView = encodeProperty(descriptor, input)
      const lazy = getProperty(descriptor, dataView, true)
      const decoded = getProperty(descriptor, dataView, false)
      expect(lazy).toEqual(input)
      expect(decoded).toEqual(input)
    })
  })

  describe('null', () => {
    it.each<[AnyDescriptor, null]>([
      [{ type: 'integer', signed: false, bits: 8, nullable: true }, null],
      [{ type: 'char', bytes: 2, nullable: true }, null],
      [{ type: 'string', nullable: true }, null],
    ])('should encode and decode null value', (descriptor, input) => {
      const dataView = encodeProperty(descriptor, input)
      const lazy = getProperty(descriptor, dataView, true)
      const decoded = getProperty(descriptor, dataView, false)
      expect(lazy).toEqual(input)
      expect(decoded).toEqual(input)
    })
  })

  describe('view', () => {
    it('should encode a decode for a descriptor', () => {
      const input = {
        foo: 'bar',
        bar: [10, 20],
        baz: { a: 1, b: 2, c: 3 },
      }

      const View = createView<typeof input, StructDescriptor>({
        type: 'struct',
        fields: [
          ['foo', { type: 'char', bytes: 3 }],
          [
            'bar',
            {
              type: 'array',
              size: 2,
              items: { type: 'integer', signed: false, bits: 8 },
            },
          ],
          [
            'baz',
            {
              type: 'dict',
              key: { type: 'char', bytes: 1 },
              value: { type: 'integer', signed: true, bits: 16 },
            },
          ],
        ],
      })

      const dataView = View.encode(input)
      const lens = View.from(input)
      const decoded = View.decode(dataView)

      expect(decoded).toEqual(input)
      expect(View.decode(lens)).toEqual(input)
      expect(View.decode(decoded)).toEqual(input)
    })
  })
})
