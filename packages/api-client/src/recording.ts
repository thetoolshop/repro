import { Recording, RecordingMetadata, RecordingView } from '@repro/domain'
import { gunzipSync, gzipSync } from 'fflate'
import { and, FutureInstance, map } from 'fluture'
import { DataLoader } from './common'

export function createRecordingApi(dataLoader: DataLoader) {
  function getAllRecordings(): FutureInstance<Error, Array<RecordingMetadata>> {
    return dataLoader('/recordings')
  }

  function saveRecording(
    projectId: string,
    title: string,
    description: string,
    recording: Recording,
    browserName: string | null,
    browserVersion: string | null,
    operatingSystem: string | null
  ): FutureInstance<Error, void> {
    const recordingData = RecordingView.encode(recording)

    const compressedData = gzipSync(
      new Uint8Array(
        recordingData.buffer,
        recordingData.byteOffset,
        recordingData.byteLength
      )
    )

    const data = dataLoader(
      `/recordings/${recording.id}/data`,
      {
        method: 'PUT',
        body: compressedData,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      },
      'binary'
    )

    const metadata = dataLoader(`/recordings/${recording.id}/metadata`, {
      method: 'PUT',
      body: JSON.stringify({
        projectId,
        title,
        description,
        mode: recording.mode,
        duration: recording.duration,
        browserName,
        browserVersion,
        operatingSystem,
      }),
    })

    return data.pipe(and(metadata))
  }

  function getRecordingData(
    recordingId: string
  ): FutureInstance<Error, Recording> {
    return dataLoader<DataView>(`/recordings/${recordingId}/data`).pipe(
      map(data => {
        const recordingData = gunzipSync(
          new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
        )

        return RecordingView.over(new DataView(recordingData.buffer))
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
    getRecordingData,
    getRecordingMetadata,
  }
}

export type RecordingApi = ReturnType<typeof createRecordingApi>
