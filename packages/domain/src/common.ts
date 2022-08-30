export type SyntheticId = string

export interface IndexedRecord<K extends string | number | symbol, V> {
  data: Record<K, V>
  index: Array<K>
}
