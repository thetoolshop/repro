import { deepmerge } from 'deepmerge-ts'
import {
  attemptP,
  bichain,
  chain,
  FutureInstance,
  map,
  reject,
  resolve,
} from 'fluture'
import nativeFetch from 'isomorphic-unfetch'
import localForage from 'localforage'

export interface ApiConfiguration {
  baseUrl: string
  authStorage: 'memory' | 'local-storage'
}

export interface AuthStore {
  getSessionToken(): FutureInstance<Error, string>
  setSessionToken(token: string): FutureInstance<Error, string>
  clearSessionToken(): FutureInstance<Error, void>
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

  function clearSessionToken(): FutureInstance<Error, void> {
    return attemptP(() => localForage.removeItem(KEY))
  }

  return {
    getSessionToken,
    setSessionToken,
    clearSessionToken,
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

  function clearSessionToken(): FutureInstance<Error, void> {
    storedToken = null
    return resolve(undefined)
  }

  return {
    getSessionToken,
    setSessionToken,
    clearSessionToken,
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
          }) as const
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
    requestType: 'json' | 'binary' = 'json',
    responseType: 'auto' | 'json' | 'binary' | 'text' = 'auto'
  ): FutureInstance<Error, R> {
    const reqOptions = createDefaultRequestOptions(authStore, requestType)

    const res = reqOptions.pipe(
      chain(reqOptions => {
        return attemptP<Error, Response>(() => {
          return nativeFetch(
            url.startsWith('http:') || url.startsWith('https:')
              ? url
              : `${config.baseUrl}/${url.replace(/^\//, '')}`,
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

          if (responseType === 'auto') {
            if (!contentType) {
              body = await res.text()
            } else if (contentType.includes('application/json')) {
              body = await res.json()
            } else if (contentType.includes('application/octet-stream')) {
              body = new DataView(await res.arrayBuffer())
            } else if (contentType.includes('image/')) {
              body = new DataView(await res.arrayBuffer())
            } else {
              body = await res.text()
            }
          } else {
            if (responseType === 'json') {
              body = await res.json()
            } else if (responseType === 'text') {
              body = await res.text()
            } else {
              body = await res.arrayBuffer()
            }
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
