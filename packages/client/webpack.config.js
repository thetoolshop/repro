const { ESBuildMinifyPlugin } = require('esbuild-loader')
const path = require('path')

module.exports = {
  mode: process.env.NODE_ENV === 'production'
    ? 'production'
    : 'development',

  entry: {
    background: path.resolve(__dirname, 'src/apps/chrome-extension/background.ts'),
    content: path.resolve(__dirname, 'src/apps/chrome-extension/content/index.ts'),
    devtools: path.resolve(__dirname, 'src/apps/devtools/embedded.tsx'),
  },

  output: {
    path: path.resolve(__dirname, 'dist/chrome-extension'),
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },

  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'esbuild-loader',
      options: {
        loader: 'tsx',
        minify: true,
        target: 'es2015',
      }
    }]
  },

  optimization: {
    minimizer: [
      new ESBuildMinifyPlugin({
        target: 'es2015'
      })
    ],
  },

  devtool: false,
}
