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
  getSessionToken(): FutureInstance<Error, string>
  setSessionToken(token: string): FutureInstance<Error, string>
}

export function createLocalStorageAuthStore(): AuthStore {
  const KEY = 'repro-session'

  function getSessionToken(): FutureInstance<Error, string> {
    return attemptP<Error, string | null>(() =>
      localForage.getItem<string>(KEY)
    ).pipe(
      chain(token => (token === null ? reject(new Error()) : resolve(token)))
    )
  }

  function setSessionToken(token: string): FutureInstance<Error, string> {
    return attemptP(() => localForage.setItem<string>(KEY, token))
  }

  return {
    getSessionToken,
    setSessionToken,
  }
}

export function createInMemoryAuthStore(): AuthStore {
  let storedToken: string | null = null

  function getSessionToken(): FutureInstance<Error, string> {
    return storedToken === null ? reject(new Error()) : resolve(storedToken)
  }

  function setSessionToken(token: string): FutureInstance<Error, string> {
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
  ): FutureInstance<Error, R> {
    const reqOptions = createDefaultRequestOptions(authStore, requestType)

    const res = reqOptions.pipe(
      chain(reqOptions => {
        return attemptP<Error, Response>(() => {
          return nativeFetch(
            `${config.baseUrl}/${url.replace(/^\//, '')}`,
            deepmerge(reqOptions, init)
          )
        })
      })
    )

    return res.pipe(
      chain<Error, Response, R>(res =>
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
