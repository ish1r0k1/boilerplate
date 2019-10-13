const webpack = require('webpack')
const merge = require('webpack-merge')
const common = require('./webpack.common')
const cssnano = require('cssnano')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const sass = require('sass')
const fiber = require('fibers')

module.exports = merge(common, {
  mode: 'production',
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
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/,
      cssProcessor: cssnano,
      cssProcessorPluginOptions: {
        preset: [
          'default',
          {
            autoprefixer: {
              add: true,
              browsers: ['last 2 versions', 'ie >= 11', 'Android >= 4'],
            },
            discardComments: { removeAll: true },
          },
        ],
      },
      canPrint: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: sass,
              sassOptions: {
                fiber
              }
            },
          },
        ],
      },
    ],
  },
})
