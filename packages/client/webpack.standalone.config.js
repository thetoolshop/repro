const { ESBuildMinifyPlugin } = require('esbuild-loader')
const path = require('path')

module.exports = {
  mode: process.env.NODE_ENV === 'production'
    ? 'production'
    : 'development',

  entry: {
    index: path.resolve(__dirname, 'src/apps/devtools/standalone.tsx'),
  },

  output: {
    path: path.resolve(__dirname, 'dist/standalone-devtools'),
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

  devServer: {
    historyApiFallback: true,
    static: path.resolve(__dirname, 'dist/standalone-devtools'),
  }
}
