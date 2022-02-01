import { corsHeaders } from './cors-headers'

export function handlePreflight(_request: Request) {
  return new Response(null, {
    headers: corsHeaders,
  })
}
