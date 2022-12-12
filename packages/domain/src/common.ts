import z from 'zod'

export const SyntheticIdSchema = z.string()
export type SyntheticId = z.infer<typeof SyntheticIdSchema>

export interface IndexedRecord<K extends string | number | symbol, V> {
  data: Record<K, V>
  index: Array<K>
}

export const uint8 = z
  .number()
  .min(0)
  .max(2 ** 8 - 1)
export const uint16 = z
  .number()
  .min(0)
  .max(2 ** 16 - 1)
export const uint32 = z
  .number()
  .min(0)
  .max(2 ** 32 - 1)

export const int8 = z
  .number()
  .min(-(2 ** 7))
  .max(2 ** 7 - 1)
export const int16 = z
  .number()
  .min(-(2 ** 15))
  .max(2 ** 15 - 1)
export const int32 = z
  .number()
  .min(-(2 ** 31))
  .max(2 ** 31 - 1)
