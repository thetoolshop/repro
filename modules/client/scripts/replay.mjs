import esbuild from 'esbuild'
import fs from 'fs-extra'
import inlineWorkerPlugin from 'esbuild-plugin-inline-worker'
import minimist from 'minimist'
import path from 'path'
import { fileURLToPath } from 'url'

const argv = minimist(process.argv.slice(2))
const serve = argv.w || argv.watch
const port = argv.p || argv.port

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = fs.realpathSync.native(path.join(__dirname, '..'))
const sourceDir = path.join(projectDir, 'src/apps/replay')
const buildDir = path.join(projectDir, 'dist/replay')

fs.copySync(path.join(sourceDir, 'static/'), buildDir)

const buildOptions = {
  bundle: true,
  entryPoints: {
    replay: path.join(sourceDir, 'index.tsx'),
  },
  minify: true,
  outdir: buildDir,
  plugins: [inlineWorkerPlugin()],
  sourcemap: true,
}

if (serve) {
  esbuild.serve({
    port,
    seredir: buildDir,
  }, buildOptions)
} else {
  esbuild.build(buildOptions)
}
