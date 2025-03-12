import { tap } from '@repro/future-utils'
import { chain, fork } from 'fluture'
import { ReadableStream, WritableStream } from 'web-streams-polyfill'
import { AuthStore } from '../auth'
import { ApiConfiguration, Fetch } from '../types'

export interface MockRequest {
  url: string
  method: string
  status: number
  requestHeaders?: Record<string, string>
  requestBody?: any
  responseHeaders?: Record<string, string>
  responseBody?: any
}

export interface TestSuiteOptions {
  createAuthStore: () => AuthStore
  createFetch: (authStore: AuthStore, config: ApiConfiguration) => Fetch
  addMock: (req: MockRequest) => void
  clearMocks: () => void
}

export const createFetchTestSuite = (options: TestSuiteOptions) => {
  const { createAuthStore, createFetch, addMock, clearMocks } = options

  return () => {
    afterEach(() => {
      clearMocks()
    })

    it('should make a request with the correct URL and options', done => {
      addMock({
        url: 'https://api.example.com/test-endpoint',
        method: 'GET',
        status: 200,
        responseBody: { success: true, data: 'test-data' },
        responseHeaders: {
          'Content-Type': 'application/json',
        },
      })

      const authStore = createAuthStore()

      const config = {
        baseUrl: 'https://api.example.com',
        authStorage: 'memory' as const,
      }

      const fetch = createFetch(authStore, config)

      authStore
        .setSessionToken('test-token')
        .pipe(tap(token => expect(token).toBe('test-token')))
        .pipe(chain(() => fetch('/test-endpoint')))
        .pipe(
          tap(res => expect(res).toEqual({ success: true, data: 'test-data' }))
        )
        .pipe(fork(error => done(error))(() => done()))
    })

    it('should support streaming responses', done => {
      addMock({
        url: 'https://api.example.com/test-endpoint',
        method: 'GET',
        status: 200,
        responseBody: new TextEncoder().encode('test-data'),
      })

      const authStore = createAuthStore()

      const config = {
        baseUrl: 'https://api.example.com',
        authStorage: 'memory' as const,
      }

      const fetch = createFetch(authStore, config)

      authStore
        .setSessionToken('test-token')
        .pipe(tap(token => expect(token).toBe('test-token')))
        .pipe(
          chain(() =>
            fetch<ReadableStream<Uint8Array>>(
              '/test-endpoint',
              {},
              'json',
              'stream'
            )
          )
        )
        .pipe(
          fork(error => done(error))(res => {
            expect(res).toBeInstanceOf(ReadableStream)

            const chunks: Array<ArrayBuffer> = []

            res.pipeTo(
              new WritableStream({
                write(chunk) {
                  console.error(chunk)
                  chunks.push(chunk)
                },

                close() {
                  console.error(chunks)
                  done()
                },
              })
            )
          })
        )
    })
  }
}
