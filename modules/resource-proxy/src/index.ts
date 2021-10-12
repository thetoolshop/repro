import dotenv from 'dotenv'
import http from 'http'
import httpProxy from 'http-proxy'

dotenv.config()

const proxy = httpProxy.createProxyServer()

const server = http.createServer((req, res) => {
  const headers = req.headers
  const target = headers['x-proxy-target']

  if (target && typeof target === 'string') {
    proxy.web(req, res, {
      target,
      changeOrigin: true,
    })

    return
  }

  res.writeHead(400, 'Bad request: missing proxy target')
  res.end()
})

server.listen(+(process.env.PORT || 8080))
