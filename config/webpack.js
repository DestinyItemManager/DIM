const webpack = require('webpack');

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackIncludeSiblingChunksPlugin = require('html-webpack-include-sibling-chunks-plugin');
const GenerateJsonPlugin = require('generate-json-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const csp = require('./content-security-policy');
const PacktrackerPlugin = require('@packtracker/webpack-plugin');

const Visualizer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const NotifyPlugin = require('notify-webpack-plugin');

const ASSET_NAME_PATTERN = 'static/[name]-[hash:6].[ext]';

const packageJson = require('../package.json');

const splash = require('../icons/splash.json');

module.exports = (env) => {
  if (process.env.WEBPACK_SERVE) {
    env.name = 'dev';
    if (!fs.existsSync('key.pem') || !fs.existsSync('cert.pem')) {
      console.log('Generating certificate');
      execSync('mkcert create-ca --validity 3650');
      execSync('mkcert create-cert --validity 3650 --key key.pem --cert cert.pem');
    }
  }

  ['release', 'beta', 'dev'].forEach((e) => {
    // set booleans based on env.name
    env[e] = e == env.name;
  });

  let version = packageJson.version.toString();
  if (env.beta && process.env.TRAVIS_BUILD_NUMBER) {
    version += `.${process.env.TRAVIS_BUILD_NUMBER}`;
  }

  const config = {
    mode: env.dev ? 'development' : 'production',

    entry: {
      main: './src/Index.tsx',
      browsercheck: './src/browsercheck.js',
      authReturn: './src/authReturn.ts',
      gdriveReturn: './src/gdriveReturn.ts'
    },

    output: {
      path: path.resolve('./dist'),
      publicPath: '/',
      filename: env.dev ? '[name]-[hash].js' : '[name]-[contenthash:6].js',
      chunkFilename: env.dev ? '[name]-[hash].js' : '[name]-[contenthash:6].js',
      futureEmitAssets: true
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
          },
          historyApiFallback: true
        }
      : {},

    // Bail and fail hard on first error
    bail: !env.dev,

    stats: env.dev ? 'minimal' : 'normal',

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
          terserOptions: {
            ecma: 8,
            module: true,
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
          exclude: [/node_modules/],
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        },
        {
          test: /\.html$/,
          exclude: /index\.html/,
          loader: 'html-loader',
          options: {
            exportAsEs6Default: true,
            minimize: true
          }
        },
        {
          test: /\.(jpg|gif|png|eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
          loader: 'url-loader',
          options: {
            limit: 5 * 1024, // only inline if less than 5kb
            name: ASSET_NAME_PATTERN
          }
        },
        // *.m.scss will have CSS Modules support
        {
          test: /\.m\.scss$/,
          use: [
            env.dev ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-modules-typescript-loader',
              options: {
                mode: process.env.CI ? 'verify' : 'emit'
              }
            },
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: env.dev ? '[name]_[local]-[hash:base64:5]' : '[hash:base64:5]'
                },
                localsConvention: 'camelCaseOnly',
                sourceMap: true
              }
            },
            'postcss-loader',
            'sass-loader'
          ]
        },
        // Regular *.scss are global
        {
          test: /\.scss$/,
          exclude: /\.m\.scss$/,
          use: [
            env.dev ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: true
              }
            },
            'postcss-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.css$/,
          use: [env.dev ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader']
        },
        // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true
              }
            },
            {
              loader: 'ts-loader'
            }
          ]
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
        return false;
      }
    },

    resolve: {
      extensions: ['.js', '.json', '.ts', '.tsx', '.jsx'],

      alias: {
        app: path.resolve('./src/app/'),
        data: path.resolve('./src/data/'),
        images: path.resolve('./src/images/'),
        'destiny-icons': path.resolve('./destiny-icons/'),
        'idb-keyval': path.resolve('./src/app/storage/idb-keyval.ts')
      }
    },

    plugins: [
      new CaseSensitivePathsPlugin(),

      new webpack.IgnorePlugin(/caniuse-lite\/data\/regions/),

      new NotifyPlugin('DIM', !env.dev),

      new MiniCssExtractPlugin({
        filename: env.dev ? '[name]-[hash].css' : '[name]-[contenthash:6].css',
        chunkFilename: env.dev ? '[name]-[hash].css' : '[id]-[contenthash:6].css'
      }),

      // Fix some chunks not showing up in Webpack 4
      new HtmlWebpackIncludeSiblingChunksPlugin(),

      new HtmlWebpackPlugin({
        inject: true,
        filename: 'index.html',
        template: 'src/index.html',
        chunks: ['main', 'browsercheck'],
        templateParameters: {
          splash
        }
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
          csp: csp(env.name)
        }
      }),

      // Generate a version info JSON file we can poll. We could theoretically add more info here too.
      new GenerateJsonPlugin('./version.json', {
        version
      }),

      new CopyWebpackPlugin([
        { from: './src/manifest-webapp-6-2018.json' },
        // Only copy the manifests out of the data folder. Everything else we import directly into the bundle.
        { from: './src/data/d1/manifests', to: 'data/d1/manifests' },
        { from: `./icons/${env.name}/` },
        { from: `./icons/splash`, to: 'splash/' },
        { from: './src/safari-pinned-tab.svg' }
      ]),

      new webpack.DefinePlugin({
        $DIM_VERSION: JSON.stringify(version),
        $DIM_FLAVOR: JSON.stringify(env.name),
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
        '$featureFlags.debugMoves': JSON.stringify(!env.release),
        '$featureFlags.reviewsEnabled': JSON.stringify(true),
        // Sync data over gdrive
        '$featureFlags.gdrive': JSON.stringify(true),
        '$featureFlags.debugSync': JSON.stringify(!env.release),
        // Enable color-blind a11y
        '$featureFlags.colorA11y': JSON.stringify(true),
        // Whether to log page views for router events
        '$featureFlags.googleAnalyticsForRouter': JSON.stringify(true),
        // Debug ui-router
        '$featureFlags.debugRouter': JSON.stringify(false),
        // Debug Service Worker
        '$featureFlags.debugSW': JSON.stringify(!env.release),
        // Send exception reports to Sentry.io on beta only
        '$featureFlags.sentry': JSON.stringify(env.beta),
        // Respect the "do not track" header
        '$featureFlags.respectDNT': JSON.stringify(!env.release),
        // Forsaken Item Tiles
        '$featureFlags.forsakenTiles': JSON.stringify(!env.release),
        // Community-curated wish lists
        '$featureFlags.wishLists': JSON.stringify(true)
      }),

      new LodashModuleReplacementPlugin({
        collections: true,
        memoizing: true,
        shorthands: true,
        flattening: true
      }),

      new webpack.WatchIgnorePlugin([/scss\.d\.ts$/])
    ],

    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    }
  };

  // Enable if you want to debug the size of the chunks
  if (env.WEBPACK_VISUALIZE) {
    config.plugins.push(new Visualizer());
  }

  if (env.release) {
    config.plugins.push(
      new CopyWebpackPlugin([
        { from: './src/android-config.json', to: '.well-known/assetlinks.json' }
      ])
    );
  }

  if (env.dev) {
    config.plugins.push(
      new WebpackNotifierPlugin({
        title: 'DIM',
        alwaysNotify: true,
        contentImage: path.join(__dirname, '../icons/release/favicon-96x96.png')
      })
    );

    config.module.rules.push({
      test: /\.jsx?$/,
      include: /node_modules/,
      use: ['react-hot-loader/webpack']
    });
  } else {
    // env.beta and env.release
    config.plugins.push(
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: ['.awcache', 'node_modules/.cache']
      }),

      // Tell React we're in Production mode
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env': JSON.stringify({ NODE_ENV: 'production' })
      }),

      // Generate a service worker
      new InjectManifest({
        maximumFileSizeToCacheInBytes: 5000000,
        include: [/\.(html|js|css|woff2|json|wasm)$/, /static\/.*\.(png|gif|jpg|svg)$/],
        exclude: [
          /version\.json/,
          /extension-dist/,
          /\.map$/,
          // Ignore both the webapp manifest and the d1-manifest files
          /data\/d1\/manifests/,
          /manifest-webapp/
        ],
        swSrc: './src/service-worker.js',
        swDest: 'service-worker.js',
        importWorkboxFrom: 'local',
        dontCacheBustUrlsMatching: /-[a-f0-9]{6}\./
      })
    );

    if (process.env.PT_PROJECT_TOKEN) {
      const packOptions = {
        upload: true,
        fail_build: true
      };

      if (process.env.TRAVIS === 'true') {
        Object.assign(packOptions, {
          branch: process.env.TRAVIS_PULL_REQUEST_BRANCH || process.env.TRAVIS_BRANCH,
          commit: process.env.TRAVIS_PULL_REQUEST_SHA || process.env.TRAVIS_COMMIT
        });
      }

      config.plugins.push(new PacktrackerPlugin(packOptions));
    }
  }

  return config;
};
