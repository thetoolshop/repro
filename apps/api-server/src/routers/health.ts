import express from 'express'
import { resolve } from 'fluture'
import { respondWith } from '~/utils/response'

export function createHealthcheckRouter() {
  const HealthcheckRouter = express.Router()

  HealthcheckRouter.get('/', (_, res) => {
    respondWith(res, resolve(undefined))
  })

  return HealthcheckRouter
}
