import { Recording, RecordingView } from '@repro/domain'
import { both, FutureInstance, map, node } from 'fluture'
import fs from 'fs'
import path from 'path'
import { QueryResultRow } from 'pg'
import { RecordingMetadata, recordingMetadataSchema } from '~/types/recording'
import { bufferToDataView } from '~/utils/buffer'
import { DatabaseClient } from './database'

interface RecordingMetadataRow extends QueryResultRow {
  id: string
  title: string
  description: string
  mode: number
  duration: number
  created_at: string
  project_id: string
  project_name: string
  author_id: string
  author_name: string
}

function toRecordingMetadata(row: RecordingMetadataRow): RecordingMetadata {
  return recordingMetadataSchema.parse({
    id: row.id,
    title: row.title,
    description: row.description,
    mode: row.mode,
    duration: row.duration,
    createdAt: row.created_at,
    projectId: row.project_id,
    projectName: row.project_name,
    authorId: row.author_id,
    authorName: row.author_name,
  })
}

export interface RecordingProvider {
  saveRecording(
    teamId: string,
    projectId: string,
    authorId: string,
    title: string,
    description: string,
    recording: Recording
  ): FutureInstance<Error, void>

  getRecordingMetadata(
    recordingId: string
  ): FutureInstance<Error, RecordingMetadata>

  getRecording(recordingId: string): FutureInstance<Error, Recording>
}

interface RecordingConfig {
  dataDirectory: string
}

export function createRecordingProvider(
  dbClient: DatabaseClient,
  config: RecordingConfig
): RecordingProvider {
  function saveRecording(
    teamId: string,
    projectId: string,
    authorId: string,
    title: string,
    description: string,
    recording: Recording
  ): FutureInstance<Error, void> {
    const writeFile = node<Error, void>(done => {
      fs.writeFile(
        path.join(config.dataDirectory, recording.id),
        RecordingView.encode(recording),
        done
      )
    })

    const writeMetadata = dbClient.query(
      `
      INSERT INTO recordings (id, team_id, author_id, project_id, title, description, mode, duration)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        recording.id,
        teamId,
        authorId,
        projectId,
        title,
        description,
        recording.mode,
        recording.duration,
      ]
    )

    return both(writeFile)(writeMetadata).pipe(map(() => undefined))
  }

  function getRecordingMetadata(
    recordingId: string
  ): FutureInstance<Error, RecordingMetadata> {
    return dbClient.getOne(
      `
      SELECT
        r.id,
        r.title,
        r.description,
        r.duration,
        r.created_at,
        p.id AS project_id,
        p.name AS project_name,
        a.id AS author_id,
        a.name AS author_name
      FROM recordings r
      INNER JOIN projects p ON r.project_id = p.id
      INNER JOIN users a ON r.author_id = a.id
      WHERE r.id = $2
      `,
      [recordingId],
      toRecordingMetadata
    )
  }

  function getRecording(recordingId: string): FutureInstance<Error, Recording> {
    return node<Error, Recording>(done => {
      fs.readFile(path.join(config.dataDirectory, recordingId), (err, buf) => {
        if (err) {
          done(err)
          return
        }

        const recording = RecordingView.over(bufferToDataView(buf))
        done(null, recording)
      })
    })
  }

  return {
    saveRecording,
    getRecordingMetadata,
    getRecording,
  }
}
