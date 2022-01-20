import { getFile } from '@/lib/b2'

const VALID_URL_PATH = /^\/[^\/]+\.repro$/

export async function handleGetFile(request: Request): Promise<Response> {
  const url = new URL(request.url)

  if (!VALID_URL_PATH.test(url.pathname)) {
    return new Response('{ "error": "File not found" }', {
      status: 404,
    })
  }

  const fileName = url.pathname.replace('/', '')
  const file = await getFile(fileName)

  if (!file) {
    return new Response('{ "error": "File not found" }', {
      status: 404,
    })
  }

  return file
}
