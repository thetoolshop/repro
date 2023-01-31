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
  PORT: z.string(),

  DATABASE_URL: z.string(),

  EMAIL_FROM_ADDRESS: z.string().email(),
  EMAIL_SMTP_HOST: z.string(),
  EMAIL_SMTP_PORT: numericStringTransform,
  EMAIL_SMTP_USE_CREDENTIALS: z.string(),
  EMAIL_SMTP_USER: z.string(),
  EMAIL_SMTP_PASS: z.string(),
  EMAIL_TEMPLATE_DIRECTORY: z.string(),

  PADDLE_VENDOR_ID: z.string(),
  PADDLE_API_KEY: z.string(),
  PADDLE_SANDBOX: z.string().optional(),

  PADDLE_TEAM_PLAN_MONTHLY: numericStringTransform,
  PADDLE_TEAM_PLAN_ANNUAL: numericStringTransform,

  RECORDING_DATA_DIRECTORY: z.string(),

  DEBUG: z.string().default('').optional(),
})

dotenv.config()
export const env = envSchema.parse(process.env)
