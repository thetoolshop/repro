import z from 'zod'

const envSchema = z.object({
  PORT: z.string(),

  DATABASE_URL: z.string(),

  EMAIL_FROM_ADDRESS: z.string().email(),
  EMAIL_SENDGRID_API_KEY: z.string(),
  EMAIL_TEMPLATE_DIRECTORY: z.string(),

  AUTH_SESSION_SECRET: z
    .string()
    .min(32, '"AUTH_SESSION_SECRET" must be at least 32 chars'),

  RECORDING_DATA_DIRECTORY: z.string(),
})

export function getEnv(env: NodeJS.ProcessEnv) {
  return envSchema.parse(env)
}
