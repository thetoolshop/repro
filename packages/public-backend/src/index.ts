import { handleGetFile } from './handlers/getFile'
import { handlePreflight } from './handlers/preflight'
import { handleUploadFile } from './handlers/uploadFile'

addEventListener('fetch', event => {
  switch (event.request.method) {
    case 'OPTIONS':
      event.respondWith(handlePreflight(event.request))
      break

    case 'GET':
      event.respondWith(handleGetFile(event.request))
      break

    case 'POST':
      event.respondWith(handleUploadFile(event.request))
      break
  }
})
