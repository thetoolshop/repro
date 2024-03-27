import dotenv from 'dotenv'
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
  DEBUG: z.string().optional(),
})

type Env = z.infer<typeof envSchema>

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

dotenv.config()
export const defaultEnv = createEnv(process.env)
