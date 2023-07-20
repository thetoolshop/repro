import { Agent } from '@repro/messaging'
import { ApiClient, defaultClient } from './createApiClient'

export function createApiClientBridge(
  agent: Agent,
  apiClient: ApiClient = defaultClient
): ApiClient {
  return new Proxy<ApiClient>(apiClient, {
    get(target: ApiClient, namespace: keyof ApiClient) {
      return new Proxy<(typeof target)[typeof namespace]>(target[namespace], {
        get(module, method: keyof typeof module) {
          if (typeof module[method] === 'function') {
            return new Proxy(module[method], {
              apply(_fn, _thisArg, args) {
                return agent.raiseIntent({
                  type: 'api:call',
                  payload: {
                    namespace,
                    method,
                    args,
                  },
                })
              },
            })
          }

          return module[method]
        },
      })
    },
  })
}
