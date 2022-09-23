import { Recording, RecordingMetadata, RecordingView } from '@repro/domain'
import { FutureInstance, map } from 'fluture'
import { DataLoader } from './common'

export function createRecordingApi(dataLoader: DataLoader) {
  function saveRecording(
    projectId: string,
    title: string,
    description: string,
    recording: Recording
  ): FutureInstance<unknown, void> {
    const formData = new FormData()
    formData.append('file', new Blob([RecordingView.encode(recording)]))
    formData.append('projectId', projectId)
    formData.append('title', title)
    formData.append('description', description)

    return dataLoader('/recordings', {
      method: 'POST',
      body: formData,
    })
  }

  function getRecording(
    recordingId: string
  ): FutureInstance<unknown, Recording> {
    return dataLoader<DataView>(`/recordings/${recordingId}`).pipe(
      map(view => RecordingView.over(view))
    )
  }

  function getRecordingMetadata(
    recordingId: string
  ): FutureInstance<unknown, RecordingMetadata> {
    return dataLoader(`/recordings/${recordingId}/metadata`)
  }

  return {
    saveRecording,
    getRecording,
    getRecordingMetadata,
  }
}

export type RecordingApi = ReturnType<typeof createRecordingApi>
