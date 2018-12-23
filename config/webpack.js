const webpack = require('webpack');

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackIncludeSiblingChunksPlugin = require('html-webpack-include-sibling-chunks-plugin');
const GenerateJsonPlugin = require('generate-json-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const csp = require('./content-security-policy');

const Visualizer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const NotifyPlugin = require('notify-webpack-plugin');

const ASSET_NAME_PATTERN = 'static/[name]-[hash:6].[ext]';

const packageJson = require('../package.json');

module.exports = (env) => {
  if (process.env.WEBPACK_SERVE) {
    env = 'dev';
    if (!fs.existsSync('key.pem') || !fs.existsSync('cert.pem')) {
      console.log('Generating certificate');
      execSync(
        "openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem -subj '/CN=www.mydom.com/O=My Company Name LTD./C=US'"
      );
    }
  }
  const isDev = env === 'dev';
  let version = packageJson.version.toString();
  if (env === 'beta' && process.env.TRAVIS_BUILD_NUMBER) {
    version += `.${process.env.TRAVIS_BUILD_NUMBER}`;
  }

  const config = {
    mode: isDev ? 'development' : 'production',

    entry: {
      main: './src/Index.tsx',
      browsercheck: './src/browsercheck.js',
      authReturn: './src/authReturn.ts',
      gdriveReturn: './src/gdriveReturn.ts'
    },

    output: {
      path: path.resolve('./dist'),
      publicPath: '/',
      filename: isDev ? '[name]-[hash].js' : '[name]-[contenthash:6].js',
      chunkFilename: isDev ? '[name]-[hash].js' : '[name]-[contenthash:6].js'
    },

    // Dev server
    serve: process.env.WEBPACK_SERVE
      ? {
          host: process.env.DOCKER ? '0.0.0.0' : 'localhost',
          devMiddleware: {
            stats: 'errors-only'
          },
          https: {
            key: fs.readFileSync('key.pem'), // Private keys in PEM format.
            cert: fs.readFileSync('cert.pem') // Cert chains in PEM format.
          }
        }
      : {},

    // Bail and fail hard on first error
    bail: !isDev,

    stats: isDev ? 'minimal' : 'normal',

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
        chunks: 'all',
        automaticNameDelimiter: '-'
      },
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          exclude: [/sqlLib/, /sql-wasm/], // ensure the sqlLib chunk doesnt get minifed
          terserOptions: {
            ecma: 8,
            compress: { warnings: false, passes: 3, toplevel: true },
            mangle: { safari10: true, toplevel: true },
            output: { safari10: true }
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
        },
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: {
            exportAsEs6Default: true,
            minimize: true
          }
        },
        {
          test: /\.(jpg|png|eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
          loader: 'url-loader',
          options: {
            limit: 5 * 1024, // only inline if less than 5kb
            name: ASSET_NAME_PATTERN
          }
        },
        {
          test: /\.scss$/,
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.css$/,
          use: [isDev ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader']
        },
        // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
        {
          test: /\.tsx?$/,
          loader: 'awesome-typescript-loader',
          options: {
            useBabel: true,
            babelCore: '@babel/core',
            useCache: true
          }
        },
        // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
        {
          enforce: 'pre',
          test: /\.jsx?$/,
          loader: 'source-map-loader'
        },
        {
          type: 'javascript/auto',
          test: /\.json/,
          include: /src(\/|\\)locale/,
          use: [
            {
              loader: 'file-loader',
              options: { name: '[name]-[hash:6].[ext]' }
            }
          ]
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
      extensions: ['.js', '.json', '.ts', '.tsx', '.jsx'],

      alias: {
        app: path.resolve('./src')
      }
    },

    plugins: [
      new CaseSensitivePathsPlugin(),

      new webpack.IgnorePlugin(/caniuse-lite\/data\/regions/),

      new webpack.ProvidePlugin({
        i18next: 'i18next',
        'window.i18next': 'i18next'
      }),

      new NotifyPlugin('DIM', !isDev),

      new MiniCssExtractPlugin({
        filename: isDev ? '[name]-[hash].css' : '[name]-[contenthash:6].css',
        chunkFilename: isDev ? '[name]-[hash].css' : '[id]-[contenthash:6].css'
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

      // Generate the .htaccess file (kind of an abuse of HtmlWebpack plugin just for templating)
      new HtmlWebpackPlugin({
        filename: '.htaccess',
        template: 'src/htaccess',
        inject: false,
        templateParameters: {
          csp: csp(env)
        }
      }),

      // Generate a version info JSON file we can poll. We could theoretically add more info here too.
      new GenerateJsonPlugin('./version.json', {
        version
      }),

      new CopyWebpackPlugin([
        { from: './extension', to: '../extension-dist' },
        { from: `./icons/${env}-extension/`, to: '../extension-dist' },
        { from: './src/manifest-webapp-6-2018.json' },
        { from: './src/manifest-webapp-6-2018-ios.json' },
        { from: './src/data', to: 'data/', ignore: ['missing_sources.json'] },
        { from: `./icons/${env}/` },
        { from: './src/safari-pinned-tab.svg' }
      ]),

      new webpack.DefinePlugin({
        $DIM_VERSION: JSON.stringify(version),
        $DIM_FLAVOR: JSON.stringify(env),
        $DIM_BUILD_DATE: JSON.stringify(Date.now()),
        // These are set from the Travis repo settings instead of .travis.yml
        $DIM_WEB_API_KEY: JSON.stringify(process.env.WEB_API_KEY),
        $DIM_WEB_CLIENT_ID: JSON.stringify(process.env.WEB_OAUTH_CLIENT_ID),
        $DIM_WEB_CLIENT_SECRET: JSON.stringify(process.env.WEB_OAUTH_CLIENT_SECRET),

        $GOOGLE_DRIVE_CLIENT_ID: JSON.stringify(
          '22022180893-raop2mu1d7gih97t5da9vj26quqva9dc.apps.googleusercontent.com'
        ),

        $BROWSERS: JSON.stringify(packageJson.browserslist),

        // Feature flags!

        // Print debug info to console about item moves
        '$featureFlags.debugMoves': JSON.stringify(env !== 'release'),
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
        // Respect the "do not track" header
        '$featureFlags.respectDNT': JSON.stringify(env !== 'release'),
        // Forsaken Item Tiles
        '$featureFlags.forsakenTiles': JSON.stringify(env !== 'release'),
        // D2 Loadout Builder
        '$featureFlags.d2LoadoutBuilder': JSON.stringify(env !== 'release'),
        // Community-curated rolls (wish lists)
        '$featureFlags.curatedRolls': JSON.stringify(true)
      }),

      new LodashModuleReplacementPlugin({
        collections: true,
        memoizing: true,
        shorthands: true,
        flattening: true
      })
    ],

    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    }
  };

  // Enable if you want to debug the size of the chunks
  if (process.env.WEBPACK_VISUALIZE) {
    config.plugins.push(new Visualizer());
  }

  if (isDev) {
    config.plugins.push(
      new WebpackNotifierPlugin({
        title: 'DIM',
        alwaysNotify: true,
        contentImage: path.join(__dirname, '../icons/release/favicon-96x96.png')
      })
    );
  } else {
    config.plugins.push(
      new CleanWebpackPlugin(['dist', '.awcache', 'node_modules/.cache'], {
        root: path.resolve('./')
      }),

      // Tell React we're in Production mode
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env': JSON.stringify({ NODE_ENV: 'production' })
      }),

      // Generate a service worker
      new InjectManifest({
        maximumFileSizeToCacheInBytes: 5000000,
        include: [/\.(html|js|css|woff2|json|wasm)/, /static\/.*\.(png|jpg|svg)/],
        exclude: [
          /sqlLib/,
          /fontawesome-webfont.*\.svg/,
          /version\.json/,
          /extension-dist/,
          /\.map$/,
          /^manifest.*\.js(?:on)?$/
        ],
        swSrc: './src/service-worker.js',
        swDest: 'service-worker.js',
        importWorkboxFrom: 'local',
        dontCacheBustUrlsMatching: /-[a-f0-9]{6}\./
      })
    );
  }

  return config;
};
