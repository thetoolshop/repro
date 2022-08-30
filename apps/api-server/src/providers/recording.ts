import { Recording, RecordingView } from '@repro/domain'
import { FutureInstance, node } from 'fluture'
import fs from 'fs'
import path from 'path'
import { RecordingMetadata } from '@/types/recording'
import { DatabaseClient } from './database'

export interface RecordingProvider {
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

interface RecordingConfig {
  dataDirectory: string
}

export function createRecordingProvider(
  dbClient: DatabaseClient,
  config: RecordingConfig
): RecordingProvider {
  function saveRecording(
    projectId: string,
    userId: string,
    title: string,
    description: string,
    recording: Recording
  ): FutureInstance<Error, void> {
    const writeFile = node<Error, void>(done => {
      fs.writeFile(
        path.join(config.dataDirectory, projectId, recording.id),
        RecordingView.encode(recording),
        done
      )
    })

    const writeMetadata = dbClient.query(
      `
      INSERT INTO recordings (id, authorId, projectId, title, description, duration)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [recording.id, userId, projectId, title, description, recording.duration]
    )
  }

  function getRecordingMetadata(
    recordingId: string,
    userId: string
  ): FutureInstance<Error, RecordingMetadata> {}

  function getRecording(
    recordingId: string,
    userId: string
  ): FutureInstance<Error, Recording> {}

  return {
    saveRecording,
    getRecordingMetadata,
    getRecording,
  }
}
