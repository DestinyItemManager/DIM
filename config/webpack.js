const webpack = require('webpack');

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const Visualizer = require('webpack-visualizer-plugin');

const NotifyPlugin = require('notify-webpack-plugin');

const ASSET_NAME_PATTERN = 'static/[name]-[hash:6].[ext]';

module.exports = (options = {}) => {
  const config = {
    entry: './app/index.js',

    output: {
      path: './app/generated',
      filename: 'bundle-[chunkhash:6].js',
    },

    devtool: 'cheap-module-source-map',

    stats: 'errors-only',

    performance: {
      hints: false
    },

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
          test: /\.template\.html$/,
          use: [
            {
              loader: 'file-loader',
              options: { name: ASSET_NAME_PATTERN },
            },
            'extract-loader',
            'html-loader'
          ],
        }, {
          test: /^(?!.*template\.html$).*\.html$/, // for html files, excluding .template.html
          loader: 'html-loader'
        }, {
          test: /\.(png|eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
          loader: 'url-loader',
          options: {
            limit: 5 * 1024, // only inline if less than 5kb
            name: ASSET_NAME_PATTERN
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

      new NotifyPlugin('DIM', options.prod),

      new ExtractTextPlugin('styles-[hash:6].css'),

      new HtmlWebpackPlugin({
        template: 'app/index.html',
      }),

      new CopyWebpackPlugin([
        {
          from: './node_modules/zip-js/WebContent',
          to: 'static/zipjs',
          ignore: ['tests/**/*'],
        },
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
    // Bail and fail hard on first error
    config.bail = true;
    config.stats = 'verbose';

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
