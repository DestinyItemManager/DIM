const webpack = require('webpack');

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
// const Visualizer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const NotifyPlugin = require('notify-webpack-plugin');

const ASSET_NAME_PATTERN = 'static/[name]-[hash:6].[ext]';

const packageJson = require('../package.json');

const nodeModulesDir = path.join(__dirname, '../node_modules');

// https://github.com/dmachat/angular-webpack-cookbook/wiki/Optimizing-Development
const preMinifiedDeps = [
  'underscore/underscore-min.js',
  'indexeddbshim/dist/indexeddbshim.min.js',
  'messageformat/messageformat.min.js',
  'jquery/dist/jquery.min.js'
];

module.exports = (env) => {
  const isDev = env === 'dev';
  let version = packageJson.version.toString();
  if (env === 'beta' && process.env.TRAVIS_BUILD_NUMBER) {
    version += `.${process.env.TRAVIS_BUILD_NUMBER}`;
  }

  const config = {
    entry: {
      main: './src/index.js',
      authReturn: './src/authReturn.js'
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
      hot: false
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
          exclude: [/node_modules/, /sql\.js/],
          use: [
            'babel-loader'
          ]
        }, {
          test: /\.json$/,
          loader: 'json-loader'
        }, {
          test: /\.html$/,
          use: [
            'raw-loader',
            'extract-loader',
            'html-loader'
          ]
        }, {
          test: /\.(png|eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
          loader: 'url-loader',
          options: {
            limit: 5 * 1024, // only inline if less than 5kb
            name: ASSET_NAME_PATTERN
          }
        }, {
          test: /\.scss$/,
          loader: ExtractTextPlugin.extract({
            use: [
              'css-loader',
              'postcss-loader',
              'sass-loader'
            ],
            fallback: 'style-loader'
          })
        }, {
          test: /\.po$/,
          loaders: ['i18next-po-loader']
        }
      ],

      noParse: [
        /\/sql\.js$/
      ]
    },

    resolve: {
      extensions: ['.js', '.json'],

      alias: {
        app: path.resolve('./src')
      }
    },

    plugins: [
      new CleanWebpackPlugin(['dist'], {
        root: path.resolve('./')
      }),

      new NotifyPlugin('DIM', !isDev),

      new ExtractTextPlugin('styles-[contenthash:6].css'),

      new HtmlWebpackPlugin({
        inject: false,
        filename: 'index.html',
        template: '!handlebars-loader!src/index.html',
        chunks: ['manifest', 'vendor', 'main']
      }),

      new HtmlWebpackPlugin({
        inject: false,
        filename: 'return.html',
        template: '!handlebars-loader!src/return.html',
        chunks: ['manifest', 'vendor', 'authReturn']
      }),

      new CopyWebpackPlugin([
        { from: './node_modules/zip-js/WebContent/z-worker.js', to: 'static/zipjs' },
        { from: './node_modules/zip-js/WebContent/inflate.js', to: 'static/zipjs' },

        { from: './src/.htaccess' },
        { from: './src/extension-scripts/main.js', to: 'extension-scripts/' },
        { from: './src/extension-scripts/content-script.js', to: 'extension-scripts/' },
        { from: './src/manifest.json' },
        { from: './src/manifest-webapp.json' },
        { from: './src/data', to: 'data/' },
        { from: `./icons/${env}/` },
        { from: './src/safari-pinned-tab.svg' },
      ]),

      // Optimize chunk IDs
      new webpack.optimize.OccurrenceOrderPlugin(true),

      // Extract a stable "vendor" chunk
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: function(module) {
          // this assumes your vendor imports exist in the node_modules directory
          return module.context && module.context.indexOf('node_modules') !== -1;
        }
      }),

      // CommonChunksPlugin will now extract all the common modules
      // from vendor and main bundles.  But since there are no more
      // common modules between them we end up with just the runtime
      // code included in the manifest file
      new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest'
      }),

      new webpack.DefinePlugin({
        $DIM_VERSION: JSON.stringify(version),
        $DIM_FLAVOR: JSON.stringify(env),
        $DIM_BUILD_DATE: JSON.stringify(Date.now()),
        $DIM_CHANGELOG: JSON.stringify(`https://github.com/DestinyItemManager/DIM/blob/${env === 'release' ? 'master' : 'dev'}/CHANGELOG.md${env === 'release' ? '' : '#next'}`),
        // These are set from the Travis repo settings instead of .travis.yml
        $DIM_API_KEY: JSON.stringify(process.env.API_KEY),
        $DIM_CLIENT_ID: JSON.stringify(process.env.OAUTH_CLIENT_ID),
        $DIM_CLIENT_SECRET: JSON.stringify(process.env.OAUTH_CLIENT_SECRET),
        // Website and extension have different keys
        $DIM_WEB_API_KEY: JSON.stringify(process.env.WEB_API_KEY),
        $DIM_WEB_CLIENT_ID: JSON.stringify(process.env.WEB_OAUTH_CLIENT_ID),
        $DIM_WEB_CLIENT_SECRET: JSON.stringify(process.env.WEB_OAUTH_CLIENT_SECRET),

        $GOOGLE_DRIVE_CLIENT_ID: JSON.stringify('22022180893-raop2mu1d7gih97t5da9vj26quqva9dc.apps.googleusercontent.com'),

        // Feature flags!

        // Tags are off in release right now
        '$featureFlags.tagsEnabled': JSON.stringify(true),
        '$featureFlags.compareEnabled': JSON.stringify(true),
        '$featureFlags.vendorsEnabled': JSON.stringify(true),
        '$featureFlags.qualityEnabled': JSON.stringify(true),
        // Additional debugging / item info tools
        '$featureFlags.debugMode': JSON.stringify(false),
        // Print debug info to console about item moves
        '$featureFlags.debugMoves': JSON.stringify(false),
        // show changelog toaster
        '$featureFlags.changelogToaster': JSON.stringify(env === 'release'),
        '$featureFlags.materialsExchangeEnabled': JSON.stringify(false),
        '$featureFlags.reviewsEnabled': JSON.stringify(true),
        // Sync data over gdrive
        '$featureFlags.gdrive': JSON.stringify(env !== 'release'),
        '$featureFlags.debugSync': JSON.stringify(false),
        // Use a WebAssembly version of SQLite, if possible
        '$featureFlags.wasm': JSON.stringify(false)
      }),

      // Enable if you want to debug the size of the chunks
      //new Visualizer(),
    ],

    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    }
  };

  // Run through big deps and extract the first part of the path,
  // as that is what you use to require the actual node modules
  // in your code. Then use the complete path to point to the correct
  // file and make sure webpack does not try to parse it
  preMinifiedDeps.forEach((dep) => {
    const depPath = path.resolve(nodeModulesDir, dep);
    config.resolve.alias[dep.split(path.sep)[0]] = depPath;
    config.module.noParse.push(new RegExp(depPath));
  });

  if (!isDev) {
    // Bail and fail hard on first error
    config.bail = true;
    config.stats = 'verbose';

    // The sql.js library doesnt work at all (reports no tables) when minified,
    // so we exclude it from the regular minification
    // FYI, uglification runs on final chunks rather than individual modules
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
      exclude: [/-sqlLib-/, /sql-wasm/], // ensure the sqlLib chunk doesnt get minifed
      compress: { warnings: false },
      output: { comments: false },
      sourceMap: true
    }));
  }

  return config;
};
