const DotenvPlugin = require('dotenv-webpack')
const { EsbuildPlugin } = require('esbuild-loader')
const path = require('path')

const env = process.env.NODE_ENV || 'development'

require('dotenv').config({
  path: path.resolve(__dirname, `.env.${env}`),
})

module.exports = {
  mode: process.env.BUILD_ENV === 'production' ? 'production' : 'development',

  entry: {
    background: path.resolve(__dirname, 'src/extension/background.ts'),
    content: path.resolve(__dirname, 'src/extension/content.ts'),
    capture: path.resolve(__dirname, 'src/index.tsx'),
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        options: {
          minify: true,
          target: 'es2015',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  optimization: {
    minimizer: [
      new EsbuildPlugin({
        target: 'es2015',
      }),
    ],
  },

  plugins: [
    new DotenvPlugin({
      path: path.resolve(__dirname, `./.env.${process.env.BUILD_ENV}`),
      safe: true,
      systemvars: true,
    }),
  ],

  devtool: process.env.BUILD_ENV === 'development' ? 'source-map' : false,
}
