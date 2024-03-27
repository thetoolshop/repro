import { RecordingResourceTable } from './RecordingResourceTable'
import { RecordingTable } from './RecordingTable'

export interface Schema {
  recordings: RecordingTable
  recording_resources: RecordingResourceTable
}

export { RecordingTable, RecordingResourceTable }
