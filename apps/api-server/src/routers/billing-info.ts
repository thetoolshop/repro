import express from 'express'
import { BillingService } from '~/services/billing'
import { respondWith } from '~/utils/response'

export function createBillingInfoRouter(billingService: BillingService) {
  const BillingRouter = express.Router()

  BillingRouter.get('/plans', (_req, res) => {
    respondWith(res, billingService.getSubscriptionPlans())
  })

  return BillingRouter
}
