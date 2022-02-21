import { handleGetFile } from './handlers/getFile'
import { handlePreflight } from './handlers/preflight'
import { handleUploadRecording } from './handlers/uploadRecording'

addEventListener('fetch', event => {
  switch (event.request.method) {
    case 'OPTIONS':
      event.respondWith(handlePreflight(event.request))
      break

    case 'GET':
      event.respondWith(handleGetFile(event.request))
      break

    case 'PUT':
      event.respondWith(handleUploadRecording(event.request))
      break
  }
})
