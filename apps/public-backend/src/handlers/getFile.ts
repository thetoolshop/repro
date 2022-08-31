import { getFile } from '~/lib/b2'
import { corsHeaders } from './cors-headers'

export async function handleGetFile(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const file = await getFile(url.pathname)

  if (!file) {
    return new Response('{ "error": "File not found" }', {
      status: 404,
      headers: corsHeaders,
    })
  }

  return new Response(file.body, {
    status: file.status,
    headers: {
      ...file.headers,
      ...corsHeaders,
    },
  })
}
