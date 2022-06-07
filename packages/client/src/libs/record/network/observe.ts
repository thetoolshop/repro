import { nanoid } from 'nanoid'
import {
  BinaryType,
  NetworkMessage,
  NetworkMessageType,
  RequestType,
} from '@/types/network'
import { ObserverLike } from '@/utils/observer'
import { SyntheticId } from '@/types/common'

type Subscriber = (message: NetworkMessage) => void

export function createNetworkObserver(
  subscriber: Subscriber
): ObserverLike<Document> {
  const xhrObserver = createXHRObserver(subscriber)
  const fetchObserver = createFetchObserver(subscriber)
  const webSocketObserver = createWebSocketObserver(subscriber)

  return {
    observe(doc, vtree) {
      xhrObserver.observe(doc, vtree)
      fetchObserver.observe(doc, vtree)
      webSocketObserver.observe(doc, vtree)
    },

    disconnect() {
      xhrObserver.disconnect()
      fetchObserver.disconnect()
      webSocketObserver.disconnect()
    },
  }
}

const textEncoder = new TextEncoder()

function createXHRObserver(subscriber: Subscriber): ObserverLike<Document> {
  const requestParams = new WeakMap<
    XMLHttpRequest,
    {
      correlationId: SyntheticId
      method: string | null
      url: string | null
      headers: Record<string, string>
    }
  >()

  function parseHeaders(rawHeaders: string | null): Record<string, string> {
    if (rawHeaders === null) {
      return {}
    }

    const entries = rawHeaders.trim().split(/[\r\n]+/)
    const headers: Record<string, string> = {}

    for (const entry of entries) {
      const parts = entry.split(': ')
      const key = parts.shift()
      const value = parts.join(': ')

      if (key) {
        headers[key] = value
      }
    }

    return headers
  }

  function handleReadyStateChange(this: XMLHttpRequest) {
    if (this.readyState !== XMLHttpRequest.DONE) {
      return
    }

    const params = requestParams.get(this)
    this.removeEventListener('readystatechange', handleReadyStateChange)
    requestParams.delete(this)
    ;(async () => {
      // Short-circuit the response event if:
      // 1. We did not capture the request phase
      // 2. Or if there has been a request error (status == 0)
      // TODO: report request errors as distinct NetworkEvent
      if (!params || this.status === 0) {
        return
      }

      let body: ArrayBuffer

      switch (this.responseType) {
        case 'arraybuffer':
          body = this.response
          break

        case 'blob':
          body = await this.response.arrayBuffer()
          break

        case 'document':
          body = textEncoder.encode(
            new XMLSerializer().serializeToString(this.response.documentElement)
          )
          break

        case 'json':
          body = textEncoder.encode(JSON.stringify(this.response)).buffer
          break

        case 'text':
        case '':
          body = textEncoder.encode(this.responseText).buffer
          break
      }

      subscriber({
        type: NetworkMessageType.FetchResponse,
        correlationId: params.correlationId,
        status: this.status,
        headers: parseHeaders(this.getAllResponseHeaders()),
        body,
      })
    })()
  }

  function register(xhr: XMLHttpRequest) {
    if (!requestParams.has(xhr)) {
      const correlationId = nanoid(4)

      requestParams.set(xhr, {
        correlationId,
        method: null,
        url: null,
        headers: {},
      })

      xhr.addEventListener('readystatechange', handleReadyStateChange)
    }
  }

  function setUrl(xhr: XMLHttpRequest, url: string) {
    const params = requestParams.get(xhr)

    if (params) {
      params.url = url
    }
  }

  function setMethod(xhr: XMLHttpRequest, method: string) {
    const params = requestParams.get(xhr)

    if (params) {
      params.method = method
    }
  }

  function setHeader(xhr: XMLHttpRequest, key: string, value: string) {
    const params = requestParams.get(xhr)

    if (params) {
      params.headers[key] = value
    }
  }

  const XMLHttpRequest = window.XMLHttpRequest
  const XHRCtorProxy = new Proxy(XMLHttpRequest, {
    construct(target, args, newTarget) {
      const xhr = Reflect.construct(target, args, newTarget)
      register(xhr)
      return xhr
    },
  })

  const open = XMLHttpRequest.prototype.open
  const openProxy = new Proxy(XMLHttpRequest.prototype.open, {
    apply(target, thisArg, args) {
      Reflect.apply(target, thisArg, args)
      const [method, url] = args
      register(thisArg)
      setUrl(thisArg, url)
      setMethod(thisArg, method)
    },
  })

  const setRequestHeader = XMLHttpRequest.prototype.setRequestHeader
  const setRequestHeaderProxy = new Proxy(
    XMLHttpRequest.prototype.setRequestHeader,
    {
      apply(target, thisArg, args) {
        Reflect.apply(target, thisArg, args)
        const [key, value] = args
        setHeader(thisArg, key, value)
      },
    }
  )

  const send = XMLHttpRequest.prototype.send
  const sendProxy = new Proxy(XMLHttpRequest.prototype.send, {
    apply(
      target,
      thisArg: XMLHttpRequest,
      args: [Document | XMLHttpRequestBodyInit | null | undefined]
    ) {
      Reflect.apply(target, thisArg, args)
      ;(async function () {
        const params = requestParams.get(thisArg)

        if (params && params.url && params.method) {
          const [rawBody] = args

          let body = new ArrayBuffer(0)

          if (rawBody) {
            if (rawBody instanceof Document) {
              body = textEncoder.encode(
                new XMLSerializer().serializeToString(rawBody.documentElement)
              )
            } else if (rawBody instanceof ArrayBuffer) {
              body = rawBody
            } else if (rawBody instanceof Blob) {
              body = await rawBody.arrayBuffer()
            } else if (typeof rawBody === 'string') {
              body = textEncoder.encode(rawBody).buffer
            }
          }

          subscriber({
            type: NetworkMessageType.FetchRequest,
            correlationId: params.correlationId,
            requestType: RequestType.XHR,
            url: params.url,
            method: params.method,
            headers: params.headers,
            body,
          })
        }
      })()
    },
  })

  return {
    observe() {
      window.XMLHttpRequest = XHRCtorProxy
      window.XMLHttpRequest.prototype.open = openProxy
      window.XMLHttpRequest.prototype.setRequestHeader = setRequestHeaderProxy
      window.XMLHttpRequest.prototype.send = sendProxy
    },

    disconnect() {
      window.XMLHttpRequest = XMLHttpRequest
      window.XMLHttpRequest.prototype.open = open
      window.XMLHttpRequest.prototype.setRequestHeader = setRequestHeader
      window.XMLHttpRequest.prototype.send = send
    },
  }
}

function createFetchObserver(subscriber: Subscriber): ObserverLike<Document> {
  function createCorrelationId() {
    return nanoid(4)
  }

  function createHeadersRecord(headers: Headers): Record<string, string> {
    const record: Record<string, string> = {}

    headers.forEach((value, key) => {
      record[key] = value
    })

    return record
  }

  const _fetch = window.fetch

  const fetchProxy = new Proxy(window.fetch, {
    apply(target, thisArg, args: [RequestInfo, RequestInit | undefined]) {
      const correlationId = createCorrelationId()
      const req = new Request(...args)

      req
        .clone()
        .arrayBuffer()
        .then(
          body => {
            subscriber({
              type: NetworkMessageType.FetchRequest,
              correlationId,
              requestType: RequestType.Fetch,
              url: req.url,
              method: req.method,
              headers: createHeadersRecord(req.headers),
              body,
            })
          },

          // TODO: capture request errors
          _err => {}
        )

      const resP: Promise<Response> = Reflect.apply(target, thisArg, [
        req.clone(),
      ])

      resP.then(
        res => {
          const copy = res.clone()

          copy.arrayBuffer().then(
            body => {
              subscriber({
                type: NetworkMessageType.FetchResponse,
                correlationId,
                status: copy.status,
                headers: createHeadersRecord(copy.headers),
                body,
              })
            },

            // TODO: capture response errors
            // If the request is aborted, reading the response body may fail
            _err => {}
          )
        },

        // TODO: capture response errors
        _err => {}
      )

      return resP
    },
  })

  return {
    observe() {
      window.fetch = fetchProxy
    },

    disconnect() {
      window.fetch = _fetch
    },
  }
}

function createWebSocketObserver(
  subscriber: Subscriber
): ObserverLike<Document> {
  const connectionIds = new WeakMap<WebSocket, SyntheticId>()

  function hasConnectionId(socket: WebSocket) {
    return connectionIds.has(socket)
  }

  function getOrCreateConnectionId(socket: WebSocket): SyntheticId {
    let connectionId = connectionIds.get(socket)

    if (!connectionId) {
      connectionId = nanoid(4)
      connectionIds.set(socket, connectionId)
    }

    return connectionId
  }

  const textEncoder = new TextEncoder()

  async function dataToArrayBuffer(
    data: string | ArrayBufferLike | Blob | ArrayBufferView
  ): Promise<ArrayBuffer> {
    let encodedData: ArrayBuffer

    if (typeof data === 'string') {
      encodedData = textEncoder.encode(data).buffer
    } else if (data instanceof Blob) {
      encodedData = await data.arrayBuffer()
    } else if (ArrayBuffer.isView(data)) {
      encodedData = data.buffer.slice(data.byteOffset, data.byteLength)
    } else {
      encodedData = data
    }

    return encodedData
  }

  function handleClose(this: WebSocket) {
    if (hasConnectionId(this)) {
      closeEffect(this)
    }
  }

  function openEffect(socket: WebSocket) {
    const connectionId = getOrCreateConnectionId(socket)
    const url = socket.url

    socket.addEventListener('close', handleClose)

    subscriber({
      type: NetworkMessageType.WebSocketOpen,
      connectionId,
      url,
    })
  }

  function closeEffect(socket: WebSocket) {
    const connectionId = getOrCreateConnectionId(socket)

    subscriber({
      type: NetworkMessageType.WebSocketClose,
      connectionId,
    })

    connectionIds.delete(socket)
    socket.removeEventListener('close', handleClose)
  }

  async function sendEffect(
    socket: WebSocket,
    data: string | ArrayBufferLike | Blob | ArrayBufferView
  ) {
    const connectionId = getOrCreateConnectionId(socket)

    const binaryType =
      typeof data === 'string' || data instanceof Blob
        ? BinaryType.Blob
        : BinaryType.ArrayBuffer

    subscriber({
      type: NetworkMessageType.WebSocketOutbound,
      connectionId,
      binaryType,
      data: await dataToArrayBuffer(data),
    })
  }

  const messageEventObserver = createMessageEventObserver(ev => {
    ;(async function () {
      const target = ev.currentTarget

      if (target && isWebSocket(target)) {
        if (!hasConnectionId(target)) {
          openEffect(target)
        }

        const connectionId = getOrCreateConnectionId(target)

        const binaryType =
          target.binaryType === 'blob'
            ? BinaryType.Blob
            : BinaryType.ArrayBuffer

        subscriber({
          type: NetworkMessageType.WebSocketInbound,
          connectionId,
          binaryType,
          data: await dataToArrayBuffer(ev.data),
        })
      }
    })()
  })

  const _WebSocket = window.WebSocket

  const WebSocketCtorProxy = new Proxy(_WebSocket, {
    construct(target, args, newTarget) {
      const ws = Reflect.construct(target, args, newTarget)
      openEffect(ws)
      return ws
    },
  })

  const close = _WebSocket.prototype.close
  const send = _WebSocket.prototype.send

  return {
    observe(doc, vtree) {
      window.WebSocket = WebSocketCtorProxy

      window.WebSocket.prototype.send = function (this, ...args) {
        if (!hasConnectionId(this)) {
          openEffect(this)
        }

        sendEffect(this, ...args)
        return send.apply(this, args)
      }

      window.WebSocket.prototype.close = function (this, ...args) {
        if (hasConnectionId(this)) {
          closeEffect(this)
        }

        return close.apply(this, args)
      }

      messageEventObserver.observe(doc, vtree)
    },

    disconnect() {
      window.WebSocket = _WebSocket
      window.WebSocket.prototype.send = send
      window.WebSocket.prototype.close = close
      messageEventObserver.disconnect()
    },
  }
}

function createMessageEventObserver(
  callback: (ev: MessageEvent) => void
): ObserverLike<Document> {
  const events = new WeakSet<MessageEvent>()

  const originalDescriptor = Object.getOwnPropertyDescriptor(
    MessageEvent.prototype,
    'data'
  )

  let newDescriptor: PropertyDescriptor | null = null

  if (originalDescriptor) {
    newDescriptor = Object.assign(
      Object.create(originalDescriptor) as PropertyDescriptor,
      {
        get(this: MessageEvent) {
          const value = originalDescriptor.get?.call(this)
          Object.defineProperty(this, 'data', { value })

          if (!events.has(this)) {
            callback(this)
            events.add(this)
          }

          return value
        },
      }
    )
  }

  return {
    observe() {
      if (newDescriptor) {
        Object.defineProperty(MessageEvent.prototype, 'data', newDescriptor)
      }
    },

    disconnect() {
      if (originalDescriptor) {
        Object.defineProperty(
          MessageEvent.prototype,
          'data',
          originalDescriptor
        )
      }
    },
  }
}

function isWebSocket(target: EventTarget): target is WebSocket {
  return target instanceof WebSocket
}
