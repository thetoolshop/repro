const DotenvPlugin = require('dotenv-webpack')
const { ESBuildMinifyPlugin } = require('esbuild-loader')
const path = require('path')

module.exports = {
  mode: process.env.BUILD_ENV === 'production'
    ? 'production'
    : 'development',

  entry: {
    background: path.resolve(__dirname, 'src/apps/capture/extension/background.ts'),
    content: path.resolve(__dirname, 'src/apps/capture/extension/content.ts'),
    capture: path.resolve(__dirname, 'src/apps/capture/index.tsx'),
  },

  output: {
    path: path.resolve(__dirname, 'dist/capture'),
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '~': path.resolve(__dirname, 'src'),
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
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    }]
  },

  optimization: {
    minimizer: [
      new ESBuildMinifyPlugin({
        target: 'es2015'
      })
    ],
  },

  plugins: [
    new DotenvPlugin({
      path: process.env.ENV_FILE || '.env',
      safe: true,
      systemvars: true,
    }),
  ],

  devtool: process.env.BUILD_ENV === 'development' ? 'source-map' : false,
}
