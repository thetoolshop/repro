import { RecordingMode } from '@repro/domain'
import { Generated } from 'kysely'

export interface RecordingTable {
  id: Generated<number>
  title: string
  url: string
  description: string
  mode: RecordingMode
  duration: number
  createdAt: Generated<string>
  browserName: string | null
  browserVersion: string | null
  operatingSystem: string | null
  codecVersion: string
}
