const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const fiber = require('fibers')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const sass = require('sass')
const TerserPlugin = require('terser-webpack-plugin')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  stats: {
    colors: true,
  },
  output: {
    filename: 'js/[name].[chunkhash:8].js',
    chunkFilename: 'js/[name].[chunkhash:8].chunk.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].css',
    }),
    new CssMinimizerPlugin({
      minimizerOptions: {
        preset: [
          'default',
          {
            discardComments: { removeAll: true },
          },
        ],
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(s[ac]|c)ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [['autoprefixer']],
              },
            },
          },
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
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        minify: (file, sourceMap) => {
          const uglifyJsOptions = {}

          if (sourceMap) {
            uglifyJsOptions.sourceMap = {
              content: sourceMap,
            }
          }

          return require('uglify-js').minify(file, uglifyJsOptions)
        },
      }),
    ],
  },
}
