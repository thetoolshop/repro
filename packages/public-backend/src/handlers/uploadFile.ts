import { uploadFile } from '@/lib/b2'

export async function handleUploadFile(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('{ "error": "Method not allowed" }', {
      status: 405,
    })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  const fileName = await uploadFile(file)

  if (!fileName) {
    return new Response('{ "error": "Could not upload file" }', {
      status: 400,
    })
  }

  return new Response(
    JSON.stringify({
      fileName,
    })
  )
}
