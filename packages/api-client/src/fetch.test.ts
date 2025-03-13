import nativeFetch from 'isomorphic-unfetch'
import { createInMemoryAuthStore } from './auth'
import { createFetch } from './fetch'
import { MockRequest, createFetchTestSuite } from './test-suites/fetch'

// Mock isomorphic-unfetch
jest.mock('isomorphic-unfetch')

describe('api-client: common', () => {
  describe('createFetch with isomorphic-unfetch', () => {
    let mocks: MockRequest[] = []

    // Create a mock fetch function
    const mockFetch = jest.mocked(nativeFetch)

    beforeAll(() => {
      mockFetch.mockImplementation((input, init) => {
        // TODO: Find matching mock request
        let url: string
        let method = 'GET'

        if (typeof input === 'string') {
          url = input
        } else if (input instanceof Request) {
          url = input.url
          method = input.method
        } else {
          url = input.toString()
        }

        if (init?.method) {
          method = init.method
        }

        for (const mock of mocks) {
          if (mock.url === url && mock.method === method) {
            let body = new ArrayBuffer(0)

            if (mock.responseBody) {
              if (mock.responseBody instanceof ArrayBuffer) {
                body = mock.responseBody
              } else if (typeof mock.responseBody === 'string') {
                body = new TextEncoder().encode(mock.responseBody)
              } else {
                body = new TextEncoder().encode(
                  JSON.stringify(mock.responseBody)
                )
              }
            }

            return Promise.resolve(
              new Response(body, {
                headers: mock.responseHeaders,
                status: mock.status,
              })
            )
          }
        }

        return Promise.reject(new Error('No matching mock'))
      })
    })

    afterAll(() => {
      mockFetch.mockRestore()
    })

    const testSuite = createFetchTestSuite({
      createAuthStore: createInMemoryAuthStore,
      createFetch,

      addMock: (req: MockRequest) => {
        mocks.push(req)
      },

      clearMocks: () => {
        mocks = []
        mockFetch.mockClear()
      },
    })

    testSuite()
  })
})
