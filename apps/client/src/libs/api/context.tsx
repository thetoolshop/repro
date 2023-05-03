import { ApiClient, createApiClient } from '@repro/api-client'
import React, { PropsWithChildren, useContext } from 'react'
import { Agent } from '@repro/messaging'

const defaultClient = createApiClient({
  baseUrl: process.env.REPRO_API_URL || '',
  authStorage: (process.env.AUTH_STORAGE as any) || 'local-storage',
})

const ApiClientContext = React.createContext(defaultClient)

export function createApiClientBridge(
  agent: Agent,
  apiClient: ApiClient = defaultClient
): ApiClient {
  return new Proxy<ApiClient>(apiClient, {
    get(target: ApiClient, namespace: keyof ApiClient) {
      return new Proxy<typeof target[typeof namespace]>(target[namespace], {
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

interface ProviderProps {
  client?: ApiClient
}

export const ApiProvider: React.FC<PropsWithChildren<ProviderProps>> = ({
  children,
  client = defaultClient,
}) => (
  <ApiClientContext.Provider value={client}>
    {children}
  </ApiClientContext.Provider>
)

export function useApiClient() {
  return useContext(ApiClientContext)
}
