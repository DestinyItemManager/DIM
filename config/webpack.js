const webpack = require('webpack');

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackIncludeSiblingChunksPlugin = require('html-webpack-include-sibling-chunks-plugin');
// const Visualizer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const NotifyPlugin = require('notify-webpack-plugin');

const ASSET_NAME_PATTERN = 'static/[name]-[hash:6].[ext]';

const packageJson = require('../package.json');

module.exports = (env) => {
  const isDev = env === 'dev';
  let version = packageJson.version.toString();
  if (env === 'beta' && process.env.TRAVIS_BUILD_NUMBER) {
    version += `.${process.env.TRAVIS_BUILD_NUMBER}`;
  }

  const config = {
    mode: isDev ? 'development' : 'production',

    entry: {
      main: './src/index.js',
      browsercheck: './src/browsercheck.js',
      authReturn: './src/authReturn.js',
      gdriveReturn: './src/gdriveReturn.js'
    },

    output: {
      path: path.resolve('./dist'),
      publicPath: '/',
      filename: '[name]-[contenthash:6].js',
      chunkFilename: '[id]-[contenthash:6].js'
    },

    stats: 'minimal',

    devtool: 'source-map',

    performance: {
      // Don't warn about too-large chunks
      hints: false
    },

    optimization: {
      // We always want the chunk name, otherwise it's just numbers
      namedChunks: true,
      // Extract the runtime into a separate chunk
      runtimeChunk: 'single',
      splitChunks: {
        chunks: "all",
        automaticNameDelimiter: "-"
      },
      minimizer: [
        new UglifyJSPlugin({
          cache: true,
          parallel: true,
          exclude: [/sqlLib/, /sql-wasm/], // ensure the sqlLib chunk doesnt get minifed
          uglifyOptions: {
            compress: { warnings: false },
            output: { comments: false }
          },
          sourceMap: true
        })
      ]
    },

    module: {
      strictExportPresence: true,

      rules: [
        {
          test: /\.js$/,
          exclude: [/node_modules/, /sql\.js/],
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }, {
          test: /\.html$/,
          loader: 'html-loader',
          options: {
            exportAsEs6Default: true
          }
        }, {
          test: /\.(jpg|png|eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
          loader: 'url-loader',
          options: {
            limit: 5 * 1024, // only inline if less than 5kb
            name: ASSET_NAME_PATTERN
          }
        }, {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader'
          ]
        }, {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
        {
          test: /\.tsx?$/,
          loader: "awesome-typescript-loader",
          options: {
            useBabel: true,
            useCache: true
          }
        },
        // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
        {
          enforce: "pre",
          test: /\.js$/,
          loader: "source-map-loader"
        },
        {
          type: 'javascript/auto',
          test: /\.json/,
          include: /src(\/|\\)locale/,
          use: [{
            loader: 'file-loader',
            options: { name: '[name]-[hash:6].[ext]' },
          }],
        },
        {
          type: 'javascript/auto',
          test: /\.wasm/
        },
        {
          test: /CHANGELOG\.md$/,
          loader: path.resolve('./config/changelog-loader')
        }
      ],

      noParse: function(path) {
        return path.endsWith('sql.js/js/sql.js');
      }
    },

    resolve: {
      extensions: ['.js', '.json', '.ts', '.tsx'],

      alias: {
        app: path.resolve('./src')
      }
    },

    plugins: [
      new webpack.IgnorePlugin(/caniuse-lite\/data\/regions/),

      new webpack.ProvidePlugin({
        i18next: 'i18next',
        'window.i18next': 'i18next'
      }),

      new NotifyPlugin('DIM', !isDev),

      new MiniCssExtractPlugin({
        filename: "[name]-[contenthash:6].css",
        chunkFilename: "[id]-[contenthash:6].css"
      }),

      // Fix some chunks not showing up in Webpack 4
      new HtmlWebpackIncludeSiblingChunksPlugin(),

      new HtmlWebpackPlugin({
        inject: true,
        filename: 'index.html',
        template: '!html-loader!src/index.html',
        chunks: ['main', 'browsercheck']
      }),

      new HtmlWebpackPlugin({
        inject: true,
        filename: 'return.html',
        template: '!html-loader!src/return.html',
        chunks: ['authReturn']
      }),

      new HtmlWebpackPlugin({
        inject: true,
        filename: 'gdrive-return.html',
        template: '!html-loader!src/gdrive-return.html',
        chunks: ['gdriveReturn']
      }),

      new CopyWebpackPlugin([
        { from: './src/.htaccess' },
        { from: './extension', to: '../extension-dist' },
        { from: `./icons/${env}-extension/`, to: '../extension-dist' },
        { from: './src/manifest-webapp.json' },
        { from: './src/manifest-webapp-ios.json' },
        { from: './src/data', to: 'data/' },
        { from: `./icons/${env}/` },
        { from: './src/safari-pinned-tab.svg' },
      ]),

      new webpack.DefinePlugin({
        $DIM_VERSION: JSON.stringify(version),
        $DIM_FLAVOR: JSON.stringify(env),
        $DIM_BUILD_DATE: JSON.stringify(Date.now()),
        // These are set from the Travis repo settings instead of .travis.yml
        $DIM_WEB_API_KEY: JSON.stringify(process.env.WEB_API_KEY),
        $DIM_WEB_CLIENT_ID: JSON.stringify(process.env.WEB_OAUTH_CLIENT_ID),
        $DIM_WEB_CLIENT_SECRET: JSON.stringify(process.env.WEB_OAUTH_CLIENT_SECRET),

        $GOOGLE_DRIVE_CLIENT_ID: JSON.stringify('22022180893-raop2mu1d7gih97t5da9vj26quqva9dc.apps.googleusercontent.com'),

        $BROWSERS: JSON.stringify(packageJson.browserslist),

        // Feature flags!

        // Print debug info to console about item moves
        '$featureFlags.debugMoves': JSON.stringify(false),
        '$featureFlags.reviewsEnabled': JSON.stringify(true),
        // Sync data over gdrive
        '$featureFlags.gdrive': JSON.stringify(true),
        '$featureFlags.debugSync': JSON.stringify(env !== 'release'),
        // Use a WebAssembly version of SQLite, if possible (this crashes on Chrome 58 on Android though)
        '$featureFlags.wasm': JSON.stringify(true),
        // Enable color-blind a11y
        '$featureFlags.colorA11y': JSON.stringify(true),
        // Whether to log page views for router events
        '$featureFlags.googleAnalyticsForRouter': JSON.stringify(true),
        // Debug ui-router
        '$featureFlags.debugRouter': JSON.stringify(false),
        // Debug Service Worker
        '$featureFlags.debugSW': JSON.stringify(env !== 'release'),
        // Send exception reports to Sentry.io on beta only
        '$featureFlags.sentry': JSON.stringify(env === 'beta'),
        // D2 Vendors
        '$featureFlags.vendors': JSON.stringify(true),
      }),

      // Enable if you want to debug the size of the chunks
      // new Visualizer(),
    ],

    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    }
  };

  if (isDev) {
    config.plugins.push(new WebpackNotifierPlugin({ title: 'DIM', alwaysNotify: true, contentImage: path.join(__dirname, '../icons/release/favicon-96x96.png') }));

    return config;
  } else {
    // Bail and fail hard on first error
    config.bail = true;
    config.stats = 'normal';

    config.plugins.push(new CleanWebpackPlugin([
      'dist',
      '.awcache',
      'node_modules/.cache'
    ], {
      root: path.resolve('./')
    }));

    // Tell React we're in Production mode
    config.plugins.push(new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env': JSON.stringify({ NODE_ENV: 'production' })
    }));

    // Generate a service worker
    config.plugins.push(new WorkboxPlugin({
      maximumFileSizeToCacheInBytes: 5000000,
      globPatterns: ['**/*.{html,js,css,woff2,json}', 'static/*.{png,jpg}'],
      globIgnores: [
        'data/**',
        'manifest-*.js',
        'extension-scripts/*',
        'service-worker.js'
      ],
      swSrc: './dist/service-worker.js',
      swDest: './dist/service-worker.js'
    }));
  }

  // Build the service worker in an entirely separate configuration so
  // it doesn't get name-mangled. It'll be used by the
  // WorkboxPlugin. This lets us inline the dependencies.
  const serviceWorker = {
    mode: isDev ? 'development' : 'production',

    entry: {
      'service-worker': './src/service-worker.js'
    },

    output: {
      path: path.resolve('./dist'),
      filename: '[name].js'
    },

    stats: 'errors-only'
  };

  return [serviceWorker, config];
};
