const fiber = require('fibers')
const sass = require('sass')
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  devtool: 'inline-cheap-source-map',
  output: {
    chunkFilename: 'js/[name].chunk.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(s[ac]|c)ss$/i,
        use: [
          'style-loader',
          'css-loader?sourceMap=true',
          {
            loader: 'sass-loader',
            options: {
              implementation: sass,
              sassOptions: {
                fiber,
              },
            },
          },
        ],
      },
    ],
  },
}
