// const webpack = require('webpack');

// const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = (options = {}) => {
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
          test: /\.html$/,
          loader: 'html-loader'
        },
      ],
    },

    resolve: {
      extensions: ['.js', '.json']
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: 'app/index.html',
      }),

      // new webpack.optimize.UglifyJsPlugin({
      //   mangle: false,
      //   compress: false
      // })
    ],
  };

  return config;
};
