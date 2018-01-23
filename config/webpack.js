const webpack = require('webpack');

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const InlineManifestWebpackPlugin = require('inline-manifest-webpack-plugin');
// const Visualizer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const NotifyPlugin = require('notify-webpack-plugin');

const ASSET_NAME_PATTERN = 'static/[name]-[hash:6].[ext]';

const packageJson = require('../package.json');

const nodeModulesDir = path.join(__dirname, '../node_modules');

// https://github.com/dmachat/angular-webpack-cookbook/wiki/Optimizing-Development
const preMinifiedDeps = [
  'underscore/underscore-min.js'
];

module.exports = (env) => {
  const isDev = env === 'dev';
  let version = packageJson.version.toString();
  if (env === 'beta' && process.env.TRAVIS_BUILD_NUMBER) {
    version += `.${process.env.TRAVIS_BUILD_NUMBER}`;
  }
  // Used for the changelog anchor
  const versionNoDots = version.replace(/\./g, '');

  const config = {
    entry: {
      main: './src/index.js',
      browsercheck: './src/browsercheck.js',
      authReturn: './src/authReturn.js',
      gdriveReturn: './src/gdriveReturn.js'
    },

    output: {
      path: path.resolve('./dist'),
      publicPath: '/',
      filename: '[name]-[chunkhash:6].js',
      chunkFilename: 'chunk-[id]-[name]-[chunkhash:6].js'
    },

    stats: 'errors-only',

    performance: {
      hints: false
    },

    module: {
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
          use: [
            'raw-loader',
            'extract-loader',
            'html-loader'
          ]
        }, {
          test: /\.(jpg|png|eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
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
          test: /\.css$/,
          loader: ExtractTextPlugin.extract({
            use: [
              'css-loader'
            ],
            fallback: 'style-loader'
          })
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
        }
      ],

      noParse: function(path) {
        return path.endsWith('sql.js/js/sql.js') || preMinifiedDeps.some((d) => path.endsWith(d));
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

      new CleanWebpackPlugin(['dist'], {
        root: path.resolve('./')
      }),

      new NotifyPlugin('DIM', !isDev),

      new ExtractTextPlugin('styles-[contenthash:6].css'),

      new InlineManifestWebpackPlugin({
        name: 'webpackManifest'
      }),

      new HtmlWebpackPlugin({
        inject: false,
        filename: 'index.html',
        template: '!handlebars-loader!src/index.html',
        chunks: ['vendor', 'main', 'browsercheck']
      }),

      new HtmlWebpackPlugin({
        inject: false,
        filename: 'return.html',
        template: '!handlebars-loader!src/return.html',
        chunks: ['vendor', 'authReturn']
      }),

      new HtmlWebpackPlugin({
        inject: false,
        filename: 'gdrive-return.html',
        template: '!handlebars-loader!src/gdrive-return.html',
        chunks: ['vendor', 'gdriveReturn']
      }),

      new CopyWebpackPlugin([
        { from: './src/.htaccess' },
        { from: './extension', to: '../extension-dist' },
        { from: `./icons/${env}-extension/`, to: '../extension-dist' },
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
        chunks: ['main', 'authReturn'],
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
        $DIM_CHANGELOG: JSON.stringify(`https://github.com/DestinyItemManager/DIM/blob/master/docs/CHANGELOG.md#${env === 'release' ? versionNoDots : 'next'}`),
        // These are set from the Travis repo settings instead of .travis.yml
        $DIM_WEB_API_KEY: JSON.stringify(process.env.WEB_API_KEY),
        $DIM_WEB_CLIENT_ID: JSON.stringify(process.env.WEB_OAUTH_CLIENT_ID),
        $DIM_WEB_CLIENT_SECRET: JSON.stringify(process.env.WEB_OAUTH_CLIENT_SECRET),

        $GOOGLE_DRIVE_CLIENT_ID: JSON.stringify('22022180893-raop2mu1d7gih97t5da9vj26quqva9dc.apps.googleusercontent.com'),

        $BROWSERS: JSON.stringify(packageJson.browserslist),

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
        // Enable activities tab
        '$featureFlags.activities': JSON.stringify(true),
        // Debug ui-router
        '$featureFlags.debugRouter': JSON.stringify(false),
        // Show drag and drop on dev only
        '$featureFlags.dnd': JSON.stringify(false),
        // Send exception reports to Google Analytics on beta only
        '$featureFlags.googleExceptionReports': JSON.stringify(env === 'beta')
      }),

      new webpack.SourceMapDevToolPlugin({
        filename: '[file].map',
        exclude: /(manifest|chunk-0-sqlLib)-\S{6}.js$/
      }),

      new webpack.optimize.ModuleConcatenationPlugin(),

      // Enable if you want to debug the size of the chunks
      // new Visualizer(),
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
  });

  if (isDev) {
    config.plugins.push(new WebpackNotifierPlugin({ title: 'DIM', alwaysNotify: true, contentImage: path.join(__dirname, '../icons/release/favicon-96x96.png') }));

    return config;
  } else {
    // Bail and fail hard on first error
    config.bail = true;
    config.stats = 'verbose';

    // Tell React we're in Production mode
    config.plugins.push(new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env': JSON.stringify({ NODE_ENV: 'production' })
    }));

    // The sql.js library doesnt work at all (reports no tables) when minified,
    // so we exclude it from the regular minification
    // FYI, uglification runs on final chunks rather than individual modules
    config.plugins.push(new UglifyJsPlugin({
      exclude: [/-sqlLib-/, /sql-wasm/], // ensure the sqlLib chunk doesnt get minifed
      uglifyOptions: {
        compress: {
          ecma: 8,
          passes: 2,
          inline: 1
        },
        output: {
          ecma: 8
        }
      },
      sourceMap: true,
      cache: true,
      parallel: true
    }));

    // Generate a service worker
    config.plugins.push(new WorkboxPlugin({
      maximumFileSizeToCacheInBytes: 5000000,
      globPatterns: ['**/*.{html,js,css,woff2}', 'static/*.png'],
      globIgnores: [
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
