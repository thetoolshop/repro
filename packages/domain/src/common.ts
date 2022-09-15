import z from 'zod'

export const SyntheticIdSchema = z.string()
export type SyntheticId = z.infer<typeof SyntheticIdSchema>

export interface IndexedRecord<K extends string | number | symbol, V> {
  data: Record<K, V>
  index: Array<K>
}
