import dotenv from 'dotenv'
import z from 'zod'

const envSchema = z.object({
  PORT: z.string(),

  DATABASE_URL: z.string(),

  EMAIL_FROM_ADDRESS: z.string().email(),
  EMAIL_SENDGRID_API_KEY: z.string(),
  EMAIL_TEMPLATE_DIRECTORY: z.string(),

  RECORDING_DATA_DIRECTORY: z.string(),

  DEBUG: z.string().default('').optional(),
})

dotenv.config()
export const env = envSchema.parse(process.env)
