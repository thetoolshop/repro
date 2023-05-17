import {
  RecordingMetadata,
  RecordingMode,
  SourceEvent,
  SourceEventView,
} from '@repro/domain'
import { createResourceMap, filterResourceMap } from '@repro/vdom-utils'
import { fromWireFormat, toWireFormat } from '@repro/wire-formats'
import { gzipSync } from 'fflate'
import {
  and,
  cache,
  chain,
  chainRej,
  FutureInstance,
  map,
  parallel,
  resolve,
} from 'fluture'
import { DataLoader } from './common'

// Resources bigger than 1MiB should either load from origin or be replaced by placeholder (TBD)
const MAX_RESOURCE_SIZE = 1_000_000

export interface RecordingApi {
  getAllRecordings(): FutureInstance<Error, Array<RecordingMetadata>>
  saveRecording(
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
  ): FutureInstance<Error, void>
  getRecordingEvents(
    recordingId: string
  ): FutureInstance<Error, Array<SourceEvent>>
  getRecordingMetadata(
    recordingId: string
  ): FutureInstance<Error, RecordingMetadata>
  getResourceMap(
    recordingId: string
  ): FutureInstance<Error, Record<string, string>>
}

export function createRecordingApi(dataLoader: DataLoader): RecordingApi {
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

    const readResources = cache(
      parallel(6)(
        resourceEntries.map(([resourceId, url]) =>
          dataLoader<DataView>(url, {}, 'binary', 'binary')
            .pipe(map(resource => [resourceId, resource] as const))
            .pipe(chainRej(() => resolve([resourceId, null] as const)))
        )
      ).pipe(
        map(
          resources =>
            resources.filter(
              ([_, resource]) =>
                resource && resource.byteLength <= MAX_RESOURCE_SIZE
            ) as Array<[string, DataView]>
        )
      )
    )

    const saveResources = readResources.pipe(
      chain(resources =>
        parallel(6)(
          resources.map(([resourceId, resource]) =>
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

    const saveResourceMap = readResources
      .pipe(map(resources => resources.map(([id]) => id)))
      .pipe(map(resourceIds => filterResourceMap(resourceMap, resourceIds)))
      .pipe(
        chain(filteredResourceMap =>
          dataLoader(`/recordings/${recordingId}/resource-map`, {
            method: 'PUT',
            body: JSON.stringify(filteredResourceMap),
          })
        )
      )

    const serializedData = events.map(toWireFormat).join('\n')
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
            events.push(SourceEventView.from(fromWireFormat(line)))
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
