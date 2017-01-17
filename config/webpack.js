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
  // TODO: we need a way of specifying the actual prod config!
  const iconFlavor = options.isProd ? 'beta' : 'dev';

  const config = {
    entry: {
      main: './src/index.js',
      authReturn: './src/authReturn.js',
    },

    output: {
      path: './dist',
      filename: '[name]-[chunkhash:6].js',
      chunkFilename: 'chunk-[id]-[name]-[chunkhash:6].js'
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
          test: /\.html$/,
          use: [
            {
              loader: 'file-loader',
              options: { name: ASSET_NAME_PATTERN },
            },
            'extract-loader',
            'html-loader'
          ],
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
        app: path.resolve('./src'),
      }
    },

    plugins: [
      new CleanWebpackPlugin(['dist'], {
        root: path.resolve('./'),
      }),

      new NotifyPlugin('DIM', options.prod),

      new ExtractTextPlugin('styles-[hash:6].css'),

      new HtmlWebpackPlugin({
        inject: false,
        filename: 'index.html',
        template: '!handlebars-loader!src/index.html',
      }),

      new HtmlWebpackPlugin({
        inject: false,
        filename: 'return.html',
        template: '!handlebars-loader!src/return.html',
      }),

      new CopyWebpackPlugin([
        {
          from: './node_modules/zip-js/WebContent',
          to: 'static/zipjs',
          ignore: ['tests/**/*'],
        },

        { from: './src/extension-scripts/main.js', to: 'extension-scripts/' },
        { from: './src/manifest.json' },
        { from: `./icons/${iconFlavor}/icon128.png` },
        { from: `./icons/${iconFlavor}/icon16.png` },
        { from: `./icons/${iconFlavor}/icon19.png` },
        { from: `./icons/${iconFlavor}/icon38.png` },
        { from: `./icons/${iconFlavor}/icon48.png` },
        { from: `./icons/${iconFlavor}/favicon-16x16.png` },
        { from: `./icons/${iconFlavor}/favicon-32x32.png` },
        { from: `./icons/${iconFlavor}/favicon-96x96.png` },

        // TODO: Quick hack to get elemental damage icon for StoreItem
        { from: './src/images/arc.png', to: 'images' },
        { from: './src/images/solar.png', to: 'images' },
        { from: './src/images/void.png', to: 'images' },
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

    // The sql.js library doesnt work at all (reports no tables) when minified,
    // so we exclude it from the regular minification
    // FYI, uglification runs on final chunks rather than individual modules
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
      exclude: /-sqlLib-/, // ensure the sqlLib chunk doesnt get minifed
      compress: { warnings: false, },
      output: { comments: false, },
      sourceMap: true,
    }));

    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
      test: /-sqlLib-/, // run only for the sql.js chunk
      compress: false,
      output: { comments: false, },
      sourceMap: true,
    }));
  }

  return config;
};
