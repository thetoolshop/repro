import { Recording } from '@repro/domain'
import { RecordingProvider } from '@/providers/recording'
import { RecordingMetadata } from '@/types/recording'
import { FutureInstance } from 'fluture'

export interface RecordingService {
  saveRecording(
    recordingId: string,
    projectId: string,
    userId: string,
    title: string,
    description: string,
    recording: Recording
  ): FutureInstance<Error, void>

  getRecordingMetadata(
    recordingId: string,
    userId: string
  ): FutureInstance<Error, RecordingMetadata>

  getRecording(
    recordingId: string,
    userId: string
  ): FutureInstance<Error, Recording>
}

export function createRecordingService(
  recordingProvider: RecordingProvider
): RecordingService {
  function saveRecording(
    recordingId: string,
    projectId: string,
    userId: string,
    title: string,
    description: string,
    recording: Recording
  ): FutureInstance<Error, void> {
    return recordingProvider.saveRecording(
      recordingId,
      projectId,
      userId,
      title,
      description,
      recording
    )
  }

  function getRecordingMetadata(
    recordingId: string,
    userId: string
  ): FutureInstance<Error, RecordingMetadata> {
    return recordingProvider.getRecordingMetadata(recordingId, userId)
  }

  function getRecording(
    recordingId: string,
    userId: string
  ): FutureInstance<Error, Recording> {
    return recordingProvider.getRecording(recordingId, userId)
  }

  return {
    saveRecording,
    getRecordingMetadata,
    getRecording,
  }
}
