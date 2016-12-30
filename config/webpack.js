const webpack = require('webpack');

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const Visualizer = require('webpack-visualizer-plugin');

module.exports = (options = {}) => {
  const config = {
    entry: './app/index.js',

    output: {
      path: './app/generated',
      filename: 'bundle-[chunkhash:6].js',
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
        }, {
          test: /\.(png|eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
          loader: 'url-loader',
          query: {
            limit: 5 * 1024, // only inline if less than 5kb
            name: '[name]-[hash:6].[ext]'
          },
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
      extensions: ['.js', '.json'],

      alias: {
        app: path.resolve('./app'),
      }
    },

    plugins: [
      new CleanWebpackPlugin(['app/generated'], {
        root: path.resolve('./'),
      }),

      new ExtractTextPlugin('styles-[hash:6].css'),

      new HtmlWebpackPlugin({
        template: 'app/index.html',
      }),

      new CopyWebpackPlugin([
        {
          from: './node_modules/zip-js/WebContent',
          to: 'zipjs'
        }
      ]),

      new Visualizer(),
    ],

    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    },
  };

  if (options.prod) {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
      sourceMap: false,
    }));
  }

  return config;
};
