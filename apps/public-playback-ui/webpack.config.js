const path = require('path')

const { EsbuildPlugin } = require('esbuild-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { EnvironmentPlugin } = require('webpack')

let baseURL = process.env.REPRO_APP_URL || '/'

if (!baseURL.endsWith('/')) {
  baseURL += '/'
}

const port = process.env.PORT || 8080

module.exports = {
  mode: process.env.BUILD_ENV === 'production' ? 'production' : 'development',

  entry: {
    index: path.resolve(__dirname, 'src/index.tsx'),
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
          target: 'esnext',
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
        target: 'esnext',
      }),
    ],
  },

  plugins: [
    new EnvironmentPlugin({
      BUILD_ENV: 'production',
      STATS_LEVEL: 'debug',
      AUTH_STORAGE: 'memory',
      REPRO_APP_URL: 'http://localhost:8080',
      REPRO_API_URL: 'http://localhost:8181',
    }),

    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/templates/index.html'),
      base: baseURL,
      hash: true,
    }),
  ],

  devServer: {
    port,
    allowedHosts: [`app.repro.localhost:${port}`, `localhost:${port}`],
    historyApiFallback: true,
    static: path.resolve(__dirname, 'dist'),
    webSocketServer: false,
  },

  devtool: process.env.BUILD_ENV === 'development' ? 'eval-source-map' : false,
}
