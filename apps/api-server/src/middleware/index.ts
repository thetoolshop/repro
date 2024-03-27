import { createAuthMiddleware } from './auth'

export function createMiddleware() {
  return {
    auth: createAuthMiddleware(),
  }
}

export type Middleware = ReturnType<typeof createMiddleware>
