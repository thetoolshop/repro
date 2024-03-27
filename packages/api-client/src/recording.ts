import {
  RecordingInfo,
  RecordingMode,
  SourceEvent,
  SourceEventView,
} from '@repro/domain'
import { createResourceMap, filterResourceMap } from '@repro/vdom-utils'
import { fromWireFormat, toWireFormat } from '@repro/wire-formats'
import { gzipSync } from 'fflate'
import {
  FutureInstance,
  and,
  cache,
  chain,
  chainRej,
  map,
  parallel,
  resolve,
} from 'fluture'
import { Fetch } from './common'

// Resources bigger than 1MiB should either load from origin or be replaced by placeholder (TBD)
const MAX_RESOURCE_SIZE = 1_000_000

export interface RecordingApi {
  getAllRecordings(): FutureInstance<Error, Array<RecordingInfo>>
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
  getRecordingInfo(recordingId: string): FutureInstance<Error, RecordingInfo>
  getResourceMap(
    recordingId: string
  ): FutureInstance<Error, Record<string, string>>
}

export function createRecordingApi(fetch: Fetch): RecordingApi {
  function getAllRecordings(): FutureInstance<Error, Array<RecordingInfo>> {
    return fetch('/recordings')
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
    const saveInfo = fetch(`/recordings/${recordingId}/info`, {
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
          fetch<DataView>(url, {}, 'binary', 'binary')
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
            fetch<void>(`/recordings/${recordingId}/resources/${resourceId}`, {
              method: 'PUT',
              body: resource,
              headers: { 'Content-Type': 'application/octet-stream' },
            })
          )
        )
      )
    )

    const saveResourceMap = readResources
      .pipe(map(resources => resources.map(([id]) => id)))
      .pipe(map(resourceIds => filterResourceMap(resourceMap, resourceIds)))
      .pipe(
        chain(filteredResourceMap =>
          fetch(`/recordings/${recordingId}/resource-map`, {
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

    const saveData = fetch(`/recordings/${recordingId}/events`, {
      method: 'PUT',
      body: gzipSync(buffer),
      headers: {
        'Content-Encoding': 'gzip',
        'Content-Type': 'text/plain',
      },
    })

    return saveInfo
      .pipe(and(saveData))
      .pipe(and(saveResources))
      .pipe(and(saveResourceMap))
  }

  function getRecordingEvents(
    recordingId: string
  ): FutureInstance<Error, Array<SourceEvent>> {
    return fetch<string>(`/recordings/${recordingId}/events`).pipe(
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

  function getRecordingInfo(
    recordingId: string
  ): FutureInstance<Error, RecordingInfo> {
    return fetch(`/recordings/${recordingId}/info`)
  }

  function getResourceMap(
    recordingId: string
  ): FutureInstance<Error, Record<string, string>> {
    return fetch(`/recordings/${recordingId}/resource-map`)
  }

  return {
    getAllRecordings,
    saveRecording,
    getRecordingEvents,
    getRecordingInfo,
    getResourceMap,
  }
}
