import { attemptP, mapRej } from 'fluture'
import z, { ZodError, ZodSchema } from 'zod'

export function parseSchema<S extends ZodSchema<any>>(
  schema: S,
  data: z.infer<S>,
  errorFactory: (reason: string) => Error
) {
  return attemptP<ZodError, z.infer<S>>(() => schema.parseAsync(data)).pipe(
    mapRej(err => errorFactory(err.toString()))
  )
}
