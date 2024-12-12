import { ApiClient } from '@repro/api-client'
import { createNotifiableBufferStream } from '@repro/buffer-utils'
import { RecordingInfo, SourceEvent, SourceEventView } from '@repro/domain'
import { encryptF } from '@repro/encryption'
import { tap } from '@repro/future-utils'
import { randomString } from '@repro/random-string'
import { createResourceMap, filterResourceMap } from '@repro/vdom-utils'
import { toWireFormat } from '@repro/wire-formats'
import { gzipSync } from 'fflate'
import {
  FutureInstance,
  both,
  cache,
  chain,
  chainRej,
  fork,
  map,
  parallel,
  resolve,
} from 'fluture'
import { UploadInput, UploadProgress, UploadStage } from '~/types/upload'

// Resources bigger than 1MiB should either load from origin or be replaced by placeholder (TBD)
const MAX_RESOURCE_SIZE = 1_000_000

export function createUploadWorker(apiClient: ApiClient) {
  const queue: Array<{ ref: string; input: UploadInput }> = []
  const progressMap: Record<string, UploadProgress> = {}

  let idle = true

  function enqueue(input: UploadInput) {
    const ref = createUploadRef()
    const progress = initializeProgress(ref)

    queue.unshift({ ref, input })
    updateStage(UploadStage.Enqueued, 1, progress)

    runNextIfIdle()

    return ref
  }

  function getProgress(ref: string) {
    return progressMap[ref] ?? null
  }

  function runNextIfIdle() {
    if (idle) {
      const next = queue.pop()

      if (next != null) {
        idle = false
        run(next.ref, next.input)
      }
    }
  }

  function run(ref: string, input: UploadInput): void {
    const progress = progressMap[ref] ?? initializeProgress(ref)

    function onSuccess() {
      complete(progress)
      idle = true
      runNextIfIdle()
    }

    function onError(error: Error) {
      completeWithError(error, progress)
      idle = true
      runNextIfIdle()
    }

    fork(onError)(onSuccess)(
      createRecording(input, progress)
        .pipe(tap(recording => setRecordingId(recording.id, progress)))
        .pipe(
          chain(recording =>
            parallel(Infinity)([
              saveEvents(recording.id, input.events, progress),
              saveResources(recording.id, input.events, progress),
            ])
          )
        )
    )
  }

  function createUploadRef() {
    return randomString()
  }

  function initializeProgress(ref: string) {
    return (progressMap[ref] = {
      ref,
      recordingId: null,
      encryptionKey: null,
      stages: {
        [UploadStage.Enqueued]: 0,
        [UploadStage.CreateRecording]: 0,
        [UploadStage.SaveEvents]: 0,
        [UploadStage.ReadResources]: 0,
        [UploadStage.SaveResources]: 0,
      },
      completed: false,
      error: null,
    })
  }

  function updateStage(
    stage: UploadStage,
    completion: number,
    progress: UploadProgress
  ) {
    progress.stages[stage] = completion
  }

  function setRecordingId(recordingId: string, progress: UploadProgress) {
    progress.recordingId = recordingId
  }

  function setEncryptionKey(encryptionKey: string, progress: UploadProgress) {
    progress.encryptionKey = encryptionKey
  }

  function complete(progress: UploadProgress) {
    progress.completed = true
  }

  function completeWithError(error: Error, progress: UploadProgress) {
    progress.error = { name: error.name, message: error.message }
    progress.completed = true
  }

  function createRecording(
    input: UploadInput,
    progress: UploadProgress
  ): FutureInstance<Error, RecordingInfo> {
    const body = createNotifiableBufferStream(
      new TextEncoder().encode(
        JSON.stringify({
          title: input.title,
          description: input.description,
          url: input.url,
          mode: input.mode,
          duration: input.duration,
          browserName: input.browserName,
          browserVersion: input.browserVersion,
          operatingSystem: input.operatingSystem,
        })
      ),
      (bytesRead, byteLength) => {
        updateStage(
          UploadStage.CreateRecording,
          bytesRead / byteLength,
          progress
        )
      }
    )

    return apiClient.fetch<RecordingInfo>('/recordings', {
      method: 'POST',
      body,
      // @ts-expect-error
      duplex: 'half',
    })
  }

  function saveEvents(
    recordingId: string,
    events: Array<SourceEvent>,
    progress: UploadProgress
  ) {
    const serializedData = events.map(toWireFormat).join('\n')
    const buffer = new Uint8Array(serializedData.length)

    let i = 0

    for (const char of serializedData) {
      buffer[i] = char.charCodeAt(0)
      i += 1
    }

    return encryptF(gzipSync(buffer)).pipe(
      chain(([encryptedBuffer, encryptionKey]) => {
        setEncryptionKey(encryptionKey, progress)

        const body = createNotifiableBufferStream(
          encryptedBuffer,
          (bytesRead, byteLength) => {
            updateStage(
              UploadStage.SaveEvents,
              bytesRead / byteLength,
              progress
            )
          }
        )

        return apiClient.fetch(`/recordings/${recordingId}/data`, {
          method: 'PUT',
          body,
          headers: { 'Content-Type': 'application/octet-stream' },
          // @ts-expect-error
          duplex: 'half',
        })
      })
    )
  }

  function saveResources(
    recordingId: string,
    events: Array<SourceEvent>,
    progress: UploadProgress
  ) {
    const resourceMap = createResourceMap(events.map(SourceEventView.decode))
    const resourceEntries = Object.entries(resourceMap)

    const totalResources = resourceEntries.length
    let resourcesRead = 0

    const readResourcesReq = cache(
      parallel(Infinity)(
        resourceEntries.map(([resourceId, url]) =>
          apiClient
            .fetch<DataView>(url, {}, 'binary', 'binary')
            .pipe(map(resource => [resourceId, resource] as const))
            .pipe(chainRej(() => resolve([resourceId, null] as const)))
            .pipe(
              tap(() => {
                updateStage(
                  UploadStage.ReadResources,
                  ++resourcesRead / totalResources,
                  progress
                )
              })
            )
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

    const saveResourcesReq = readResourcesReq.pipe(
      chain(resources => {
        const totalBytes = resources.reduce(
          (total, [, resource]) => total + resource.byteLength,
          0
        )

        let totalBytesWritten = 0

        return parallel(Infinity)(
          resources.map(([resourceId, resource]) => {
            return apiClient
              .fetch<void>(
                `/recordings/${recordingId}/resources/${resourceId}`,
                {
                  method: 'PUT',
                  body: resource,
                  headers: { 'Content-Type': 'application/octet-stream' },
                }
              )
              .pipe(
                tap(() => {
                  totalBytesWritten += resource.byteLength
                  updateStage(
                    UploadStage.SaveResources,
                    totalBytesWritten / totalBytes,
                    progress
                  )
                })
              )
          })
        )
      })
    )

    const saveResourceMapReq = readResourcesReq
      .pipe(map(r => r.map(([id]) => id)))
      .pipe(map(resourceIds => filterResourceMap(resourceMap, resourceIds)))
      .pipe(
        chain(filteredResourceMap =>
          apiClient.fetch(`/recordings/${recordingId}/resource-map`, {
            method: 'PUT',
            body: JSON.stringify(filteredResourceMap),
          })
        )
      )

    return both(saveResourcesReq)(saveResourceMapReq)
  }

  return {
    enqueue,
    getProgress,
  }
}
