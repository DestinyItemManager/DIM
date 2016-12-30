const webpack = require('webpack');

// const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = (options) => {
  const config = {
    entry: './app/index.js',

    output: {
      path: './app/generated',
      filename: 'bundle-[chunkhash].js',
    },

    devtool: 'cheap-module-source-map',

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        }, {
          test: /\.json$/,
          loader: 'json-loader'
        }, {
          test: /\.png$/,
          loader: 'file-loader'
        }, {
          test: /\.html$/,
          loader: 'html-loader'
        }, {
          test: /\.scss$/,
          loader: ExtractTextPlugin.extract({
            fallbackLoader: 'style-loader',
            loader: 'css-loader!sass-loader',
          }),
        }
      ],
    },

    resolve: {
      extensions: ['.js', '.json']
    },

    plugins: [
      new ExtractTextPlugin('styles-[hash].css'),

      new HtmlWebpackPlugin({
        template: 'app/index.html',
      }),

      new CopyWebpackPlugin([
        {
          from: './node_modules/zip-js/WebContent',
          to: 'zipjs'
        }
      ]),
    ],

    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    },
  };

  if (options && options.prod) {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
      mangle: false,
      compress: false
    }));
  }

  return config;
};
