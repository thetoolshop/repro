export {}

declare global {
  // envvars and secrets
  const STORAGE_API_DEFAULT_BASE_URL: string
  const STORAGE_API_VERSION: string
  const STORAGE_API_KEY_ID: string
  const STORAGE_API_KEY: string
  const STORAGE_API_BUCKET_ID: string
  const STORAGE_API_BUCKET_NAME: string

  // KV namespaces
  const SESSION: KVNamespace
}
