import { handleGetFile } from './handlers/getFile'
import { handleUploadFile } from './handlers/uploadFile'

addEventListener('fetch', event => {
  switch (event.request.method) {
    case 'GET':
      event.respondWith(handleGetFile(event.request))
      break

    case 'POST':
      event.respondWith(handleUploadFile(event.request))
      break
  }
})
