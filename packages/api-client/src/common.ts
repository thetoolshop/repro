import { deepmerge } from 'deepmerge-ts'
import nativeFetch from 'isomorphic-unfetch'
import {
  attemptP,
  bichain,
  chain,
  FutureInstance,
  map,
  reject,
  resolve,
} from 'fluture'
import localForage from 'localforage'

export interface ApiConfiguration {
  baseUrl: string
  authStorage: 'memory' | 'local-storage'
}

export interface AuthStore {
  getSessionToken(): FutureInstance<unknown, string>
  setSessionToken(token: string): FutureInstance<unknown, string>
}

export function createLocalStorageAuthStore(): AuthStore {
  const KEY = 'repro-session'

  function getSessionToken(): FutureInstance<unknown, string> {
    return attemptP(() => localForage.getItem<string>(KEY)).pipe(
      chain(token => (token === null ? reject(undefined) : resolve(token)))
    )
  }

  function setSessionToken(token: string): FutureInstance<unknown, string> {
    return attemptP(() => localForage.setItem<string>(KEY, token))
  }

  return {
    getSessionToken,
    setSessionToken,
  }
}

export function createInMemoryAuthStore(): AuthStore {
  let storedToken: string | null = null

  function getSessionToken(): FutureInstance<unknown, string> {
    return storedToken === null ? reject(undefined) : resolve(storedToken)
  }

  function setSessionToken(token: string): FutureInstance<unknown, string> {
    storedToken = token
    return resolve(storedToken)
  }

  return {
    getSessionToken,
    setSessionToken,
  }
}

export function createDefaultRequestOptions(
  authStore: AuthStore,
  requestType: 'json' | 'binary'
) {
  return authStore
    .getSessionToken()
    .pipe(bichain(() => resolve(''))(resolve))
    .pipe(
      map(
        token =>
          ({
            mode: 'cors',
            cache: 'no-store',
            credentials: 'omit',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...(requestType === 'json'
                ? { 'Content-Type': 'application/json' }
                : {}),
            },
            method: 'GET',
          } as const)
      )
    )
}

export function createDataLoader(
  authStore: AuthStore,
  config: ApiConfiguration
) {
  return function dataLoader<R = any>(
    url: string,
    init: RequestInit = {},
    requestType: 'json' | 'binary' = 'json'
  ): FutureInstance<unknown, R> {
    const reqOptions = createDefaultRequestOptions(authStore, requestType)

    const res = reqOptions.pipe(
      chain(reqOptions => {
        return attemptP(() => {
          return nativeFetch(
            `${config.baseUrl}/${url.replace(/^\//, '')}`,
            deepmerge(reqOptions, init)
          )
        })
      })
    )

    return res.pipe(
      chain<unknown, Response, R>(res =>
        attemptP(async () => {
          const contentType = res.headers.get('content-type')

          let body: any

          if (!contentType) {
            body = await res.text()
          } else if (contentType.includes('application/json')) {
            body = await res.json()
          } else if (contentType.includes('application/octet-stream')) {
            body = new DataView(await res.arrayBuffer())
          } else {
            body = await res.text()
          }

          if (!res.ok) {
            throw body
          }

          return body
        })
      )
    )
  }
}

export type DataLoader = ReturnType<typeof createDataLoader>
