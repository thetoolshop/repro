import { RecordingMetadata, RecordingMode, SourceEvent } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { Observable } from 'rxjs'
import { Readable } from 'stream'
import { RecordingProvider } from '~/providers/recording'

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
    operatingSystem: string | null,
    isPublic: boolean
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
      operatingSystem,
      isPublic
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

  function saveResourceMap(
    recordingId: string,
    resourceMap: Record<string, string>
  ): FutureInstance<Error, void> {
    return recordingProvider.saveResourceMap(recordingId, resourceMap)
  }

  function getResourceMap(
    recordingId: string
  ): FutureInstance<Error, Record<string, string>> {
    return recordingProvider.getResourceMap(recordingId)
  }

  function checkRecordingIsPublic(
    recordingId: string
  ): FutureInstance<Error, void> {
    return recordingProvider.checkRecordingIsPublic(recordingId)
  }

  function checkUserIsAuthor(
    recordingId: string,
    userId: string
  ): FutureInstance<Error, void> {
    return recordingProvider.checkUserIsAuthor(recordingId, userId)
  }

  return {
    getAllRecordingsForUser,
    saveRecordingMetadata,
    getRecordingMetadata,
    saveRecordingEvents,
    getRecordingEvents,
    saveResourceMap,
    getResourceMap,
    checkRecordingIsPublic,
    checkUserIsAuthor,
  }
}

export type RecordingService = ReturnType<typeof createRecordingService>
