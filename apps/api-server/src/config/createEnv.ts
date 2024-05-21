import z from 'zod'

const numericStringTransform = z.preprocess(val => {
  if (typeof val === 'string') {
    return parseInt(val, 10)
  }

  if (typeof val === 'number') {
    return val
  }

  return undefined
}, z.number())

const envSchema = z.object({
  HOST: z.string().default('localhost'),
  PORT: numericStringTransform.default(8080),
  DB_FILE: z.string(),
  STORAGE_DIR: z.string(),
  CERT_KEY_FILE: z.string(),
  CERT_FILE: z.string(),
  SESSION_SECRET: z.string().default('this-is-a-session-secret'),
  SESSION_COOKIE: z.string().default('sessid'),
  SESSION_SOFT_EXPIRY: numericStringTransform.default(3600),
  SESSION_HARD_EXPIRY: numericStringTransform.default(28 * 24 * 3600),
  DEBUG: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

type Replacer = {
  replace<K extends keyof Env>(key: K, value: Env[K]): () => void
}

export function createEnv(
  values: Record<string, unknown> = process.env
): Env & Replacer {
  const env = envSchema.parse(values) as Env & Replacer

  env.replace = function replace<K extends keyof Env>(key: K, value: Env[K]) {
    const original = env[key]
    // @ts-expect-error
    env[key] = envSchema.shape[key].parse(value) as Env[K]
    return () => {
      env[key] = original
    }
  }

  return env
}
