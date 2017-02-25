const webpack = require('webpack');

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const Visualizer = require('webpack-visualizer-plugin');

const NotifyPlugin = require('notify-webpack-plugin');

const ASSET_NAME_PATTERN = 'static/[name]-[hash:6].[ext]';

const packageJson = require('../package.json');

module.exports = (env) => {
  const isDev = env === 'dev';
  let version = packageJson.version.toString();
  if (process.env.TRAVIS_BUILD_NUMBER) {
    version += "." + process.env.TRAVIS_BUILD_NUMBER;
  }

  const config = {
    entry: {
      main: './src/index.js',
      authReturn: './src/authReturn.js',
    },

    output: {
      path: path.resolve('./dist'),
      filename: '[name]-[chunkhash:6].js',
      chunkFilename: 'chunk-[id]-[name]-[chunkhash:6].js'
    },

    devServer: {
      contentBase: path.resolve(__dirname, './src'),
      publicPath: '/',
      https: true,
      host: '0.0.0.0',
      hot: false,
      //headers: { "X-Custom-Header": "yes" }
    },

    devtool: 'source-map',

    stats: 'errors-only',

    performance: {
      hints: false
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            'babel-loader'
          ],
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
            use: [
              'css-loader',
              'postcss-loader',
              'sass-loader'
            ],
            fallback: 'style-loader'
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

      new NotifyPlugin('DIM', !isDev),

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

        { from: './src/.htaccess' },
        { from: './src/extension-scripts/main.js', to: 'extension-scripts/' },
        { from: './src/manifest.json' },
        { from: './src/manifest-webapp.json' },
        { from: './src/data', to: 'data/' },
        { from: `./icons/${env}/` },
      ]),

      new webpack.DefinePlugin({
        $DIM_VERSION: JSON.stringify(version),
        $DIM_FLAVOR: JSON.stringify(env),
        $DIM_CHANGELOG: JSON.stringify(`https://github.com/DestinyItemManager/DIM/blob/${env === 'release' ? 'master' : 'dev'}/CHANGELOG.md${env === 'release' ? '' : '#next'}`),
        // These are set from the Travis repo settings instead of .travis.yml
        $DIM_API_KEY: JSON.stringify(process.env.API_KEY),
        $DIM_AUTH_URL: JSON.stringify(process.env.AUTH_URL),
        // Website and extension have different keys
        $DIM_WEB_API_KEY: JSON.stringify(process.env.WEB_API_KEY),
        $DIM_WEB_AUTH_URL: JSON.stringify(process.env.WEB_AUTH_URL)
      }),

      new Visualizer(),
    ],

    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    },
  };

  if (!isDev) {
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
