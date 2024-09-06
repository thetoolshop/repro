const { EsbuildPlugin } = require('esbuild-loader')
const path = require('path')
const { EnvironmentPlugin } = require('webpack')

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
    new EnvironmentPlugin([
      'AUTH_STORAGE',
      'BUILD_ENV',
      'MIXPANEL_API_URL',
      'MIXPANEL_TOKEN',
      'REPRO_APP_URL',
      'REPRO_API_URL',
      'STATS_LEVEL',
    ]),
  ],

  devtool: process.env.BUILD_ENV === 'development' ? 'source-map' : false,
}
