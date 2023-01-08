import { RecordingMetadata, RecordingMode, SourceEvent } from '@repro/domain'
import { RecordingProvider } from '~/providers/recording'
import { FutureInstance } from 'fluture'
import { Observable } from 'rxjs'
import { Readable } from 'stream'

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
    url: string,
    description: string,
    mode: RecordingMode,
    duration: number,
    browserName: string | null,
    browserVersion: string | null,
    operatingSystem: string | null
  ): FutureInstance<Error, void> {
    return recordingProvider.saveRecordingMetadata(
      teamId,
      projectId,
      recordingId,
      authorId,
      title,
      url,
      description,
      mode,
      duration,
      browserName,
      browserVersion,
      operatingSystem
    )
  }

  function getRecordingMetadata(
    recordingId: string
  ): FutureInstance<Error, RecordingMetadata> {
    return recordingProvider.getRecordingMetadata(recordingId)
  }

  function saveRecordingEvents(
    recordingId: string,
    eventStream: Readable
  ): FutureInstance<Error, void> {
    return recordingProvider.saveRecordingEvents(recordingId, eventStream)
  }

  function getRecordingEvents(
    recordingId: string
  ): FutureInstance<Error, Observable<SourceEvent>> {
    return recordingProvider.getRecordingEvents(recordingId)
  }

  return {
    getAllRecordingsForUser,
    saveRecordingMetadata,
    getRecordingMetadata,
    saveRecordingEvents,
    getRecordingEvents,
  }
}

export type RecordingService = ReturnType<typeof createRecordingService>
