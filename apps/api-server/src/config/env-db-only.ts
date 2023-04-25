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
  DB_HOST: z.string(),
  DB_PORT: numericStringTransform,
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_DATABASE: z.string(),
  DB_USE_SSL: z.string(),
  DEBUG: z.string().default('').optional(),
})

dotenv.config()
export const env = envSchema.parse(process.env)
