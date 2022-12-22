import {
  RecordingMetadata,
  RecordingMetadataView,
  RecordingMode,
} from '@repro/domain'
import { FutureInstance, map } from 'fluture'
import { QueryResultRow } from 'pg'
import { DatabaseClient } from './database'

interface RecordingMetadataRow extends QueryResultRow {
  id: string
  title: string
  description: string
  mode: number
  duration: number
  created_at: Date
  project_id: string
  project_name: string
  author_id: string
  author_name: string
  browser_name: string | null
  browser_version: string | null
  operating_system: string | null
}

function toRecordingMetadata(row: RecordingMetadataRow): RecordingMetadata {
  return RecordingMetadataView.validate({
    id: row.id,
    title: row.title,
    description: row.description,
    mode: row.mode,
    duration: row.duration,
    createdAt: row.created_at.toISOString(),
    projectId: row.project_id,
    projectName: row.project_name,
    authorId: row.author_id,
    authorName: row.author_name,
    browserName: row.browser_name,
    browserVersion: row.browser_version,
    operatingSystem: row.operating_system,
  })
}

export function createRecordingProvider(dbClient: DatabaseClient) {
  function getAllRecordingsForUser(
    userId: string
  ): FutureInstance<Error, Array<RecordingMetadata>> {
    return dbClient.getMany(
      `
      SELECT
        r.id,
        r.title,
        r.description,
        r.mode,
        r.duration,
        r.created_at,
        r.project_id,
        p.name as project_name,
        r.author_id,
        a.name as author_name,
        r.browser_name,
        r.browser_version,
        r.operating_system
      FROM recordings r
      INNER JOIN projects p ON p.id = r.project_id
      INNER JOIN users a ON a.id = r.author_id
      INNER JOIN projects_users m ON m.project_id = r.project_id
      WHERE m.user_id = $1
      `,
      [userId],
      toRecordingMetadata
    )
  }

  function saveRecordingMetadata(
    teamId: string,
    projectId: string,
    recordingId: string,
    authorId: string,
    title: string,
    description: string,
    mode: RecordingMode,
    duration: number,
    browserName: string | null,
    browserVersion: string | null,
    operatingSystem: string | null
  ): FutureInstance<Error, void> {
    return dbClient
      .query(
        `
        INSERT INTO recordings
          (id, team_id, author_id, project_id, title, description, mode, duration,
            browser_name, browser_version, operating_system)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          recordingId,
          teamId,
          authorId,
          projectId,
          title,
          description,
          mode,
          duration,
          browserName,
          browserVersion,
          operatingSystem,
        ]
      )
      .pipe(map(() => undefined))
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
        r.mode,
        r.duration,
        r.created_at,
        p.id AS project_id,
        p.name AS project_name,
        a.id AS author_id,
        a.name AS author_name,
        r.browser_name,
        r.browser_version,
        r.operating_system
      FROM recordings r
      INNER JOIN projects p ON r.project_id = p.id
      INNER JOIN users a ON r.author_id = a.id
      WHERE r.id = $1
      `,
      [recordingId],
      toRecordingMetadata
    )
  }

  return {
    getAllRecordingsForUser,
    saveRecordingMetadata,
    getRecordingMetadata,
  }
}

export type RecordingProvider = ReturnType<typeof createRecordingProvider>
