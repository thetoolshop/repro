require('dotenv').config()

const DotenvPlugin = require('dotenv-webpack')
const { EsbuildPlugin } = require('esbuild-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

let baseURL = process.env.REPRO_APP_URL || '/'

if (!baseURL.endsWith('/')) {
  baseURL += '/'
}

module.exports = {
  mode: process.env.BUILD_ENV === 'production'
    ? 'production'
    : 'development',

  entry: {
    index: path.resolve(__dirname, 'src/apps/main/index.tsx'),
  },

  output: {
    path: path.resolve(__dirname, 'dist/main'),
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
      new EsbuildPlugin({
        target: 'es2015'
      })
    ],
  },

  plugins: [
    new DotenvPlugin({
      systemvars: true,
    }),

    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/apps/main/templates/index.html'),
      base: baseURL,
      hash: true,
    }),
  ],

  devServer: {
    allowedHosts: [
      'app.repro.test',
      'localhost:8080',
    ],
    historyApiFallback: true,
    static: path.resolve(__dirname, 'dist/main'),
  },

  devtool: process.env.BUILD_ENV === 'development' ? 'eval-source-map' : false,
}
