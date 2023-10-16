const DotenvPlugin = require('dotenv-webpack')
const { EsbuildPlugin } = require('esbuild-loader')
const path = require('path')

module.exports = {
  mode: process.env.BUILD_ENV === 'production' ? 'production' : 'development',

  entry: {
    background: path.resolve(__dirname, 'src/extension/background.ts'),
    content: path.resolve(__dirname, 'src/extension/content.ts'),
    page: path.resolve(__dirname, 'src/index.tsx'),
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
          loader: 'tsx',
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
      path: process.env.ENV_FILE || '.env',
      safe: true,
      systemvars: true,
    }),
  ],

  devtool: process.env.BUILD_ENV === 'development' ? 'source-map' : false,
}
