import { Recording, RecordingMetadata } from '@repro/domain'
import { RecordingProvider } from '~/providers/recording'
import { FutureInstance } from 'fluture'

export function createRecordingService(recordingProvider: RecordingProvider) {
  function saveRecording(
    teamId: string,
    projectId: string,
    authorId: string,
    title: string,
    description: string,
    recording: Recording
  ): FutureInstance<Error, void> {
    return recordingProvider.saveRecording(
      teamId,
      projectId,
      authorId,
      title,
      description,
      recording
    )
  }

  function getRecordingMetadata(
    recordingId: string
  ): FutureInstance<Error, RecordingMetadata> {
    return recordingProvider.getRecordingMetadata(recordingId)
  }

  function getRecording(recordingId: string): FutureInstance<Error, Recording> {
    return recordingProvider.getRecording(recordingId)
  }

  return {
    saveRecording,
    getRecordingMetadata,
    getRecording,
  }
}

export type RecordingService = ReturnType<typeof createRecordingService>
