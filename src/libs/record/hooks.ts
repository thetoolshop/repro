import { useContext } from 'react'
import { useAtomValue } from '@/utils/state'
import { RecordingStreamContext } from './context'

export function useRecordingStream() {
  return useContext(RecordingStreamContext)
}
