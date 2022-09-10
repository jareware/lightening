const path = require('path')
const nodeExternals = require('webpack-node-externals')

const entry = { server: './src/server/index.ts' }

module.exports = {
  mode: process.env.NODE_ENV ? process.env.NODE_ENV : 'development',
  target: 'node',
  devtool: 'inline-source-map',
  entry: entry,
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'src/server/tsconfig.json',
            },
          },
        ],
      },
    ],
  },
}
