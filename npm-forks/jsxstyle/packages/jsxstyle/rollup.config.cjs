// @ts-check

const { DEFAULT_EXTENSIONS } = require('@babel/core');
const invariant = require('invariant');
const path = require('path');
const fs = require('fs').promises;
const { babel } = require('@rollup/plugin-babel');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

/** @satisfies {import('rollup').ModuleFormat[]} */
const supportedModuleFormats = ['cjs', 'es'];

const topLevelModules = ['preact', 'solid', 'utils', 'webpack-plugin'];

const experimentalModules = ['nextjs-plugin', 'bundler-utils', 'vite-plugin'];

/** @type {Record<string, Partial<Record<'require' | 'import' | 'types', string>>>} */
const exportsObject = {
  '.': {
    import: '',
    require: '',
  },
};

const packagesDir = path.resolve(__dirname, '..');

/** @type {import('rollup').Plugin} */
const rollupPackageJsonPlugin = {
  name: 'module-package-json-files',
  async renderChunk(code, chunk, options) {
    if (!chunk.facadeModuleId) return null;

    const sourceTSFile = path.relative(packagesDir, chunk.facadeModuleId);
    invariant(
      sourceTSFile.endsWith('.ts') || sourceTSFile.endsWith('.tsx'),
      'Expected a TypeScript source file'
    );

    const prefix = topLevelModules.includes(chunk.name)
      ? './'
      : experimentalModules.includes(chunk.name)
      ? './experimental/'
      : './private/';
    const modulePath = chunk.name === 'react' ? '.' : prefix + chunk.name;
    const moduleEntry = (exportsObject[modulePath] ||= {});

    moduleEntry['types'] = './lib/' + sourceTSFile.replace(/\.tsx?$/, '.d.ts');

    if (options.format === 'cjs') {
      moduleEntry['require'] = './' + chunk.fileName;
    } else if (options.format === 'es') {
      moduleEntry['import'] = './' + chunk.fileName;
    } else {
      throw new Error('Unhandled format: ' + options.format);
    }

    return null;
  },
  async writeBundle() {
    const sortedEntries = Object.fromEntries(
      Object.entries(exportsObject)
        .map(
          /** @returns {[string, any]} */
          ([key, value]) => {
            return [
              key,
              {
                // `types` always goes first: https://nodejs.org/api/packages.html#community-conditions-definitions
                types: value.types,
                import: value.import,
                require: value.require,
              },
            ];
          }
        )
        .sort(
          ([a], [b]) =>
            // sort by number of subfolders, then alphabetically
            a.split('/').length - b.split('/').length || a.localeCompare(b)
        )
    );

    const pkgJsonPath = path.join(__dirname, 'package.json');
    const pkgJsonContent = await fs.readFile(pkgJsonPath, 'utf-8');

    const pkgJson = JSON.parse(pkgJsonContent);
    pkgJson.exports = sortedEntries;
    pkgJson.main = exportsObject['.'].require;
    pkgJson.module = exportsObject['.'].import;
    pkgJson.types = exportsObject['.'].types;
    await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
  },
};

/** @type {import('rollup').RollupOptions} */
module.exports = {
  context: packagesDir,
  // prettier-ignore
  input: {
    'preact':         '../jsxstyle-preact/src/index.ts',
    'react':          '../jsxstyle-react/src/index.ts',
    'solid':          '../jsxstyle-solid/src/index.tsx',
    'utils':          '../jsxstyle-utils/src/index.ts',

    'bundler-utils':  '../jsxstyle-bundler-utils/src/index.ts',
    'nextjs-plugin':  '../jsxstyle-nextjs-plugin/src/index.ts',
    'vite-plugin':    '../jsxstyle-vite-plugin/src/index.ts',
    'webpack-plugin': '../jsxstyle-webpack-plugin/src/plugin.ts',
    'webpack-loader': '../jsxstyle-webpack-plugin/src/loader.ts',

    'base64-loader':  '../jsxstyle-webpack-plugin/src/base64Loader.ts',
    'noop':           '../jsxstyle-bundler-utils/src/noop.ts',
    'extract-styles': '../jsxstyle-bundler-utils/src/ast/extractStyles.ts',
  },
  output: supportedModuleFormats.map(
    /** @returns {import('rollup').OutputOptions} */
    (format) => {
      const ext = '.' + (format === 'cjs' ? 'cjs' : 'js');
      return {
        format,
        interop: 'compat',
        dir: __dirname,
        entryFileNames: (chunkInfo) => {
          invariant(chunkInfo.facadeModuleId, 'Missing facadeModuleId');
          return path.join(
            'lib',
            path
              .relative(packagesDir, chunkInfo.facadeModuleId)
              .replace(/\.tsx?$/, ext)
          );
        },
        chunkFileNames: 'lib/chunks/[name].[hash]' + ext,
        sourcemap: true,
      };
    }
  ),
  plugins: [
    nodeResolve({
      preferBuiltins: true,
      extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx'],
    }),
    babel({
      cwd: packagesDir,
      babelHelpers: 'bundled',
      extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
    }),
    rollupPackageJsonPlugin,
  ],
  external(source, importer) {
    // ignore local imports
    if (
      source.startsWith('.') ||
      source.startsWith('/') ||
      importer?.includes('/node_modules/')
    ) {
      return;
    }
    // mark everything else as external
    return true;
  },
  watch: { exclude: ['node_modules/**'] },
};
