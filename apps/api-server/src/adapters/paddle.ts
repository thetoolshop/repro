import { attemptP, FutureInstance } from 'fluture'
import PaddleSDK from 'paddle-sdk'

interface PaddleConfig {
  vendorId: string
  apiKey: string
  useSandbox: boolean
}

type PriceMap = {
  USD: string
  [currencyCode: string]: string
}

export type ProductPlansResult = Array<{
  id: number
  name: string
  billing_type: 'month' | 'year'
  billing_period: number
  initial_price: PriceMap
  recurring_price: PriceMap
  trial_days: number
}>

export function createPaddleAdapter(config: PaddleConfig) {
  const sdk = new PaddleSDK(config.vendorId, config.apiKey, undefined, {
    sandbox: config.useSandbox,
  })

  function wrap<R = any>(
    fn: (sdk: PaddleSDK) => Promise<R>
  ): FutureInstance<Error, R> {
    return attemptP<Error, R>(() => fn(sdk))
  }

  function getProductPlans() {
    return wrap<ProductPlansResult>(sdk => sdk.getProductPlans())
  }

  return {
    wrap,
    getProductPlans,
  }
}

export type PaddleAdapter = ReturnType<typeof createPaddleAdapter>
