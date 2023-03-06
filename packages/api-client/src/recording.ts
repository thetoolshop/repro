import {
  RecordingMetadata,
  RecordingMode,
  SourceEvent,
  SourceEventView,
} from '@repro/domain'
import { createResourceMap } from '@repro/vdom-utils'
import { gzipSync } from 'fflate'
// @ts-ignore
import { and, chain, FutureInstance, map, parallel } from 'fluture'
import { DataLoader } from './common'

// Resources bigger than 1MiB should either load from origin or be replaced by placeholder (TBD)
const MAX_RESOURCE_SIZE = 1_000_000

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

    // Source events are decoded for efficiency. It is expensive to deeply traverse
    // all VDOM lenses contained within events.
    const resourceMap = createResourceMap(events.map(SourceEventView.decode))
    const resourceEntries = Object.entries(resourceMap)

    const readResources = parallel(6)(
      resourceEntries.map(([resourceId, url]) =>
        dataLoader<DataView>(url, {}, 'binary', 'binary').pipe(
          map(resource => [resourceId, resource] as const)
        )
      )
    )

    const saveResources = readResources.pipe(
      chain(resources =>
        parallel(6)(
          resources
            .filter(([_, resource]) => resource.byteLength <= MAX_RESOURCE_SIZE)
            .map(([resourceId, resource]) =>
              dataLoader<void>(
                `/recordings/${recordingId}/resources/${resourceId}`,
                {
                  method: 'PUT',
                  body: resource,
                  headers: { 'Content-Type': 'application/octet-stream' },
                }
              )
            )
        )
      )
    )

    const saveResourceMap = dataLoader(
      `/recordings/${recordingId}/resource-map`,
      {
        method: 'PUT',
        body: JSON.stringify(resourceMap),
      }
    )

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

    return saveMetadata
      .pipe(and(saveData))
      .pipe(and(saveResources))
      .pipe(and(saveResourceMap))
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

  function getResourceMap(
    recordingId: string
  ): FutureInstance<Error, Record<string, string>> {
    return dataLoader(`/recordings/${recordingId}/resource-map`)
  }

  return {
    getAllRecordings,
    saveRecording,
    getRecordingEvents,
    getRecordingMetadata,
    getResourceMap,
  }
}

export type RecordingApi = ReturnType<typeof createRecordingApi>
