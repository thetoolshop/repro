import { RecordingMetadata, RecordingMode } from '@repro/domain'
import { RecordingProvider } from '~/providers/recording'
import { FutureInstance } from 'fluture'

export function createRecordingService(recordingProvider: RecordingProvider) {
  function getAllRecordingsForUser(
    userId: string
  ): FutureInstance<Error, Array<RecordingMetadata>> {
    return recordingProvider.getAllRecordingsForUser(userId)
  }

  function saveRecordingMetadata(
    teamId: string,
    projectId: string,
    recordingId: string,
    authorId: string,
    title: string,
    description: string,
    mode: RecordingMode,
    duration: number
  ): FutureInstance<Error, void> {
    return recordingProvider.saveRecordingMetadata(
      teamId,
      projectId,
      recordingId,
      authorId,
      title,
      description,
      mode,
      duration
    )
  }

  function getRecordingMetadata(
    recordingId: string
  ): FutureInstance<Error, RecordingMetadata> {
    return recordingProvider.getRecordingMetadata(recordingId)
  }

  return {
    getAllRecordingsForUser,
    saveRecordingMetadata,
    getRecordingMetadata,
  }
}

export type RecordingService = ReturnType<typeof createRecordingService>
