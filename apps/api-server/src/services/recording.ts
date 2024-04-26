import { CODEC_VERSION, RecordingInfo, RecordingMode } from '@repro/domain'
import { FutureInstance, chain, map, reject, resolve } from 'fluture'
import { Selectable } from 'kysely'
import { Readable } from 'node:stream'
import Sqids from 'sqids'
import { Database, RecordingTable, attemptQuery } from '~/modules/database'
import { Storage } from '~/modules/storage'
import { notFound, resourceConflict } from '~/utils/errors'

export function createRecordingService(database: Database, storage: Storage) {
  const sqids = new Sqids({
    minLength: 7,
  })

  function transformInfoRow(row: Selectable<RecordingTable>): RecordingInfo {
    const id = sqids.encode([row.id])
    return { ...row, id }
  }

  function readDataAsStream(
    recordingId: string
  ): FutureInstance<Error, Readable> {
    return storage
      .exists(recordingId)
      .pipe(
        chain(exists =>
          exists
            ? storage.read(`${recordingId}/data`)
            : reject(notFound('Recording data not found'))
        )
      )
  }

  function writeDataFromStream(
    recordingId: string,
    data: Readable
  ): FutureInstance<Error, void> {
    return readInfo(recordingId).pipe(
      chain(() => {
        return storage.exists(`${recordingId}/data`).pipe(
          chain(exists => {
            return exists
              ? reject(
                  resourceConflict(
                    `Data for recording "${recordingId}" already exists`
                  )
                )
              : storage.write(`${recordingId}/data`, data)
          })
        )
      })
    )
  }

  function readResourceAsStream(
    recordingId: string,
    resourceId: string
  ): FutureInstance<Error, Readable> {
    return storage.read(`${recordingId}/resources/${resourceId}`)
  }

  function writeResourceFromStream(
    recordingId: string,
    resourceId: string,
    data: Readable
  ): FutureInstance<Error, void> {
    return storage.write(`${recordingId}/resources/${resourceId}`, data)
  }

  function readResourceMap(
    recordingId: string
  ): FutureInstance<Error, Record<string, string>> {
    const id = sqids.decode(recordingId)[0]

    if (id === undefined) {
      return reject(notFound(`Cannot find recording with ID "${recordingId}"`))
    }

    return attemptQuery(() =>
      database
        .selectFrom('recording_resources')
        .where('recordingId', '=', id)
        .select(['key', 'value'])
        .execute()
    ).pipe(
      map(rows => Object.fromEntries(rows.map(row => [row.key, row.value])))
    )
  }

  function writeResourceMap(
    recordingId: string,
    resourceMap: Record<string, string>
  ): FutureInstance<Error, void> {
    const id = sqids.decode(recordingId)[0]

    if (id === undefined) {
      return reject(notFound(`Cannot find recording with ID "${recordingId}"`))
    }

    const rows = Object.entries(resourceMap).map(([key, value]) => ({
      key,
      value,
      recordingId: id,
    }))

    if (!rows.length) {
      return resolve(undefined)
    }

    return attemptQuery(() =>
      database.insertInto('recording_resources').values(rows).execute()
    ).pipe(map(() => undefined))
  }

  function listInfo(
    offset = 0,
    limit = 50
  ): FutureInstance<Error, Array<RecordingInfo>> {
    return attemptQuery(() => {
      return database
        .selectFrom('recordings')
        .selectAll()
        .offset(offset)
        .limit(limit)
        .execute()
    }).pipe(map(rows => rows.map(transformInfoRow)))
  }

  function readInfo(recordingId: string): FutureInstance<Error, RecordingInfo> {
    const id = sqids.decode(recordingId)[0]

    if (id === undefined) {
      return reject(notFound())
    }

    return attemptQuery(() => {
      return database
        .selectFrom('recordings')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirstOrThrow()
    }).pipe(map(transformInfoRow))
  }

  function writeInfo(
    title: string,
    url: string,
    description: string,
    mode: RecordingMode,
    duration: number,
    browserName: string | null,
    browserVersion: string | null,
    operatingSystem: string | null
  ): FutureInstance<Error, RecordingInfo> {
    return attemptQuery(() => {
      return database
        .insertInto('recordings')
        .values({
          title,
          url,
          description,
          mode,
          duration,
          browserName,
          browserVersion,
          operatingSystem,
          codecVersion: CODEC_VERSION,
        })
        .returningAll()
        .executeTakeFirstOrThrow()
    }).pipe(map(transformInfoRow))
  }

  return {
    readDataAsStream,
    writeDataFromStream,
    readResourceAsStream,
    writeResourceFromStream,
    readResourceMap,
    writeResourceMap,
    listInfo,
    readInfo,
    writeInfo,
  }
}

export type RecordingService = ReturnType<typeof createRecordingService>
