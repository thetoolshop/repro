import { FastifyRequest } from 'fastify'
import { FutureInstance, resolve } from 'fluture'

export function createAuthMiddleware() {
  function ensureStaffUser(_: FastifyRequest): FutureInstance<Error, void> {
    return resolve(undefined)
  }

  return {
    ensureStaffUser,
  }
}

export type AuthMiddleware = ReturnType<typeof createAuthMiddleware>
