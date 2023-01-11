import {
  RecordingMetadata,
  RecordingMode,
  SourceEvent,
  SourceEventView,
} from '@repro/domain'
import { gzipSync } from 'fflate'
import { and, FutureInstance, map } from 'fluture'
import { DataLoader } from './common'

export function createRecordingApi(dataLoader: DataLoader) {
  function getAllRecordings(): FutureInstance<Error, Array<RecordingMetadata>> {
    return dataLoader('/recordings')
  }

  function saveRecording(
    recordingId: string,
    title: string,
    url: string,
    description: string,
    projectId: string,
    duration: number,
    mode: RecordingMode,
    events: Array<SourceEvent>,
    isPublic: boolean,
    context: {
      browserName: string | null
      browserVersion: string | null
      operatingSystem: string | null
    }
  ): FutureInstance<Error, void> {
    const saveMetadata = dataLoader(`/recordings/${recordingId}/metadata`, {
      method: 'PUT',
      body: JSON.stringify({
        title,
        url,
        description,
        projectId,
        duration,
        mode,
        browserName: context.browserName,
        browserVersion: context.browserVersion,
        operatingSystem: context.operatingSystem,
        public: isPublic,
      }),
    })

    const serializedData = events
      .map(event => SourceEventView.serialize(event))
      .join('\n')
    const buffer = new Uint8Array(serializedData.length)

    let i = 0

    for (const char of serializedData) {
      buffer[i] = char.charCodeAt(0)
      i += 1
    }

    const saveData = dataLoader(`/recordings/${recordingId}/events`, {
      method: 'PUT',
      body: gzipSync(buffer),
      headers: {
        'Content-Encoding': 'gzip',
        'Content-Type': 'text/plain',
      },
    })

    return saveMetadata.pipe(and(saveData))
  }

  function getRecordingEvents(
    recordingId: string
  ): FutureInstance<Error, Array<SourceEvent>> {
    return dataLoader<string>(`/recordings/${recordingId}/events`).pipe(
      map(data => {
        const lines = data.split('\n')
        const events: Array<SourceEvent> = []

        for (const line of lines) {
          if (line) {
            events.push(SourceEventView.deserialize(line))
          }
        }

        return events
      })
    )
  }

  function getRecordingMetadata(
    recordingId: string
  ): FutureInstance<Error, RecordingMetadata> {
    return dataLoader(`/recordings/${recordingId}/metadata`)
  }

  return {
    getAllRecordings,
    saveRecording,
    getRecordingEvents,
    getRecordingMetadata,
  }
}

export type RecordingApi = ReturnType<typeof createRecordingApi>
