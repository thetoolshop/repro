import esbuild from 'esbuild'
import fs from 'fs-extra'
import inlineWorkerPlugin from 'esbuild-plugin-inline-worker'
import minimist from 'minimist'
import path from 'path'
import { fileURLToPath } from 'url'

const argv = minimist(process.argv.slice(2))
const watch = argv.w || argv.watch

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = fs.realpathSync.native(path.join(__dirname, '..'))
const sourceDir = path.join(projectDir, 'src/apps/chrome-extension')
const buildDir = path.join(projectDir, 'dist/chrome-extension')

fs.copySync(path.join(sourceDir, 'static/'), buildDir)

esbuild.build({
  bundle: true,
  entryPoints: {
    content: path.join(sourceDir, 'content/index.tsx'),
    rc: path.join(sourceDir, 'content/recording-controller.tsx'),
    popup: path.join(sourceDir, 'popup/index.tsx'),
  },
  minify: !watch,
  outdir: buildDir,
  plugins: [inlineWorkerPlugin()],
  sourcemap: !watch,
  watch,
})
