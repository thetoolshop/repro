import { FastifyPluginAsync } from 'fastify'
import { Middleware } from '~/middleware'
import type { HealthService } from '~/services/health'
import { respondWith } from '~/utils/response'

export function createHealthRouter(
  healthService: HealthService,
  _: Middleware
): FastifyPluginAsync {
  return async function (fastify) {
    fastify.get('/', (_, res) => {
      respondWith(res, healthService.check())
    })
  }
}
