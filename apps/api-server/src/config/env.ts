import z from 'zod'

const envSchema = z.object({
  PORT: z.string(),

  DATABASE_URL: z.string(),

  EMAIL_FROM_ADDRESS: z.string().email(),
  EMAIL_SENDGRID_API_KEY: z.string(),
  EMAIL_TEMPLATE_DIRECTORY: z.string(),

  RECORDING_DATA_DIRECTORY: z.string(),
})

export function getEnv(env: NodeJS.ProcessEnv) {
  return envSchema.parse(env)
}
