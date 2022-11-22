import { FreePlanView, TeamPlanView } from '@repro/domain'
import { FutureInstance, map, resolve } from 'fluture'
import { PaddleAdapter } from '~/adapters/paddle'
import { env } from '~/config/env'

function indexBy<V extends object>(
  key: keyof V,
  objs: Array<V>
): Record<any, V> {
  return objs.reduce((acc, obj) => {
    acc[obj[key] as string | number] = obj
    return acc
  }, {} as Record<any, V>)
}

export function createBillingService(paddleAdapter: PaddleAdapter) {
  function getSubscriptionPlans() {
    const vendorPlans = paddleAdapter
      .getProductPlans()
      .pipe(map(plans => indexBy('id', plans)))

    return resolve({
      free: FreePlanView.validate({
        type: 'free',
        includedSeats: 3,
        uploadLimit: 25,
      }),

      team: TeamPlanView.validate({
        type: 'team',
        includedSeats: 5,
        trialLengthDays: 0,
        billingPeriods: {
          month: {
            pricePerSeat: 0,
            vendorPlanId: 0,
          },

          year: {
            pricePerSeat: 0,
            vendorPlanId: 0,
          },
        },
      }),
    })
  }

  return {
    getSubscriptionPlans,
  }
}

export type BillingService = ReturnType<typeof createBillingService>
