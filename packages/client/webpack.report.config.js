const DotenvPlugin = require('dotenv-webpack')
const { ESBuildMinifyPlugin } = require('esbuild-loader')
const path = require('path')

module.exports = {
  mode: process.env.BUILD_ENV === 'production'
    ? 'production'
    : 'development',

  entry: {
    index: path.resolve(__dirname, 'src/apps/report/index.tsx'),
  },

  output: {
    path: path.resolve(__dirname, 'dist/report'),
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
      safe: true,
      systemvars: true,
    }),
  ],

  devServer: {
    historyApiFallback: true,
    static: path.resolve(__dirname, 'dist/report'),
  }
}
