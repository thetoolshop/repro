#!/usr/bin/env node

import esbuild from 'esbuild'
import fs from 'fs'
import fsp from 'fs/promises'
import http from 'http'
import path from 'path'

const projectDir = fs.realpathSync(process.cwd())
const sourceDir = path.join(projectDir, 'src/apps/devtools')
const buildDir = path.join(projectDir, 'dist/standalone-devtools')

function createBuildDir() {
  return fsp.mkdir(buildDir, { recursive: true })
}

function copyStaticAssets() {
  return fsp.cp(`${sourceDir}/static/`, buildDir, { recursive: true })
}

async function serve() {
  const serveOptions = {
    port: 8001,
    servedir: buildDir,
  }

  const buildOptions = {
    entryPoints: {
      index: path.join(sourceDir, 'standalone.tsx'),
    },
    bundle: true,
    outdir: buildDir,
  }

  const { host, port } = await esbuild.serve(serveOptions, buildOptions)

  const proxy = http.createServer((req, res) => {
    function forwardRequest(path) {
      const requestOptions = {
        hostname: host,
        port,
        path,
        method: req.method,
        headers: req.headers,
      }

      const proxyReq = http.request(requestOptions, proxyRes => {
        if (proxyRes.statusCode === 404) {
          return forwardRequest('/')
        }

        res.writeHead(proxyRes.statusCode, proxyRes.headers)
        proxyRes.pipe(res, { end: true })
      })

      req.pipe(proxyReq, { end: true })
    }

    forwardRequest(req.url)
  })

  return new Promise(resolve => {
    proxy.listen(8000, resolve)
  })
}

function build() {
  return esbuild.build({
    bundle: true,
    minify: true,
    outdir: buildDir,
    sourcemap: true,
  })
}

async function main() {
  await createBuildDir()
  await copyStaticAssets()

  // TODO: cli params to build or serve
  await serve()
}

main()
