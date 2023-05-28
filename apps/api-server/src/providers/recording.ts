import {
  CODEC_VERSION,
  migrate,
  CodecVersion,
  RecordingMetadata,
  RecordingMetadataView,
  RecordingMode,
  SourceEvent,
} from '@repro/domain'
import { fromJSON, fromWireFormat, toJSON } from '@repro/wire-formats'
import { chain, FutureInstance, map as fMap, mapRej } from 'fluture'
import { QueryResultRow } from 'pg'
import { Observable, map as rxMap } from 'rxjs'
import { Readable, Transform } from 'stream'
import { permissionDenied } from '~/utils/errors'
import { DatabaseClient } from './database'

interface RecordingMetadataRow extends QueryResultRow {
  id: string
  title: string
  url: string
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
  public: boolean
  codec_version: string
}

function toRecordingMetadata(row: RecordingMetadataRow): RecordingMetadata {
  return RecordingMetadataView.validate({
    id: row.id,
    title: row.title,
    url: row.url,
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
    public: row.public,
    codecVersion: row.codec_version,
  })
}

interface SourceEventRow extends QueryResultRow {
  data: string
}

function toSourceEvent(
  row: SourceEventRow,
  codecVersion: CodecVersion
): SourceEvent {
  const data = fromJSON(row.data)
  migrate(data, codecVersion, CODEC_VERSION)
  return data
}

interface ResourceMapRow extends QueryResultRow {
  resource_map: string
}

function toResourceMap(row: ResourceMapRow): Record<string, string> {
  return JSON.parse(row.resource_map)
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
        r.url,
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
        r.operating_system,
        r.public,
        r.codec_version
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
    url: string,
    description: string,
    mode: RecordingMode,
    duration: number,
    browserName: string | null,
    browserVersion: string | null,
    operatingSystem: string | null,
    isPublic: boolean
  ): FutureInstance<Error, void> {
    return dbClient
      .query(
        `
        INSERT INTO recordings
          (id, team_id, author_id, project_id, title, url, description, mode, duration,
            browser_name, browser_version, operating_system, public, codec_version)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `,
        [
          recordingId,
          teamId,
          authorId,
          projectId,
          title,
          url,
          description,
          mode,
          duration,
          browserName,
          browserVersion,
          operatingSystem,
          isPublic,
          CODEC_VERSION,
        ]
      )
      .pipe(fMap(() => undefined))
  }

  function getRecordingMetadata(
    recordingId: string
  ): FutureInstance<Error, RecordingMetadata> {
    return dbClient.getOne(
      `
      SELECT
        r.id,
        r.title,
        r.url,
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
        r.operating_system,
        r.public,
        r.codec_version
      FROM recordings r
      INNER JOIN projects p ON r.project_id = p.id
      INNER JOIN users a ON r.author_id = a.id
      WHERE r.id = $1
      `,
      [recordingId],
      toRecordingMetadata
    )
  }

  function saveRecordingEvents(
    recordingId: string,
    eventStream: Readable
  ): FutureInstance<Error, void> {
    const transform = new Transform({
      transform(data, _, callback) {
        const event = fromWireFormat(data.toString())
        const row = [recordingId, event.time, event.type, toJSON(event)].join(
          '\x02'
        )

        this.push(`${row}\n`)

        callback()
      },
    })

    return dbClient.writeFromStream(
      'recording_events',
      ['recording_id', 'time', 'type', 'data'],
      eventStream.pipe(transform)
    )
  }

  function getRecordingEvents(
    recordingId: string
  ): FutureInstance<Error, Observable<SourceEvent>> {
    const codecVersion = dbClient.getOne(
      `SELECT codec_version FROM recordings WHERE id = $1`,
      [recordingId],
      row => row.codec_version as CodecVersion
    )

    return codecVersion.pipe(
      chain(codecVersion => {
        return dbClient
          .queryAsStream<SourceEventRow>(
            `
            SELECT data
            FROM recording_events
            WHERE recording_id = $1
            ORDER BY id
            `,
            [recordingId]
          )
          .pipe(
            fMap(row$ =>
              row$.pipe(rxMap(row => toSourceEvent(row, codecVersion)))
            )
          )
      })
    )
  }

  function saveResourceMap(
    recordingId: string,
    resourceMap: Record<string, string>
  ): FutureInstance<Error, void> {
    return dbClient
      .query(
        `
        INSERT INTO recording_resource_maps (recording_id, resource_map)
        VALUES ($1, $2)
        `,
        [recordingId, JSON.stringify(resourceMap)]
      )
      .pipe(fMap(() => undefined))
  }

  function getResourceMap(
    recordingId: string
  ): FutureInstance<Error, Record<string, string>> {
    return dbClient.getOne(
      `SELECT resource_map FROM recording_resource_maps WHERE recording_id = $1`,
      [recordingId],
      toResourceMap
    )
  }

  function checkRecordingIsPublic(
    recordingId: string
  ): FutureInstance<Error, void> {
    return dbClient
      .getOne(
        `
        SELECT 1
        FROM recordings
        WHERE id = $1 AND public = true
        `,
        [recordingId]
      )
      .pipe(mapRej(() => permissionDenied()))
      .pipe(fMap(() => undefined))
  }

  function checkUserIsAuthor(
    recordingId: string,
    userId: string
  ): FutureInstance<Error, void> {
    return dbClient
      .getOne(
        `
        SELECT 1
        FROM recordings
        WHERE id = $1 AND author_id = $2
        `,
        [recordingId, userId]
      )
      .pipe(mapRej(() => permissionDenied()))
      .pipe(fMap(() => undefined))
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

export type RecordingProvider = ReturnType<typeof createRecordingProvider>
