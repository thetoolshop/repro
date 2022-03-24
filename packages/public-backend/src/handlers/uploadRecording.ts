import { uploadFile } from '@/lib/b2'
import { corsHeaders } from './cors-headers'

function badRequest() {
  return new Response(JSON.stringify({ error: 'Bad request' }), {
    status: 400,
    headers: corsHeaders,
  })
}

function methodNotAllowed() {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 400,
    headers: corsHeaders,
  })
}

const VALID_URL_PATH = /^\/([^\/]+)/

export async function handleUploadRecording(
  request: Request
): Promise<Response> {
  if (request.method !== 'PUT') {
    return methodNotAllowed()
  }

  const url = new URL(request.url)
  const match = VALID_URL_PATH.exec(url.pathname)

  if (!match) {
    return badRequest()
  }

  const recordingId = match[1]
  const data = await request.formData()
  const recording = data.get('recording')
  const assets = data.getAll('asset')

  if (!recording || typeof recording === 'string') {
    return badRequest()
  }

  if (recording.name !== recordingId) {
    return badRequest()
  }

  for (const asset of assets) {
    if (typeof asset === 'string') {
      return badRequest()
    }
  }

  try {
    await Promise.all([
      uploadFile(`/${recordingId}/recording`, recording),
      ...(assets as Array<File>).map(asset =>
        uploadFile(`/${recordingId}/assets/${asset.name}`, asset)
      ),
    ])
  } catch {
    return new Response('{ "error": "Could not upload recording" }', {
      status: 400,
      headers: corsHeaders,
    })
  }

  return new Response(
    JSON.stringify({
      id: recordingId,
    }),
    { headers: corsHeaders }
  )
}
