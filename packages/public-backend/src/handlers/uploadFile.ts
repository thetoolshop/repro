import { uploadFile } from '@/lib/b2'
import { corsHeaders } from './cors-headers'

export async function handleUploadFile(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('{ "error": "Method not allowed" }', {
      status: 405,
      headers: corsHeaders,
    })
  }

  const data = await request.arrayBuffer()
  const fileName = await uploadFile(data)

  if (!fileName) {
    return new Response('{ "error": "Could not upload file" }', {
      status: 400,
      headers: corsHeaders,
    })
  }

  return new Response(
    JSON.stringify({
      fileName,
    }),
    { headers: corsHeaders }
  )
}
