const webpack = require('webpack');

const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { execSync } = require('child_process');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const GenerateJsonPlugin = require('generate-json-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const csp = require('./content-security-policy');
const browserslist = require('browserslist');
const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const svgToMiniDataURI = require('mini-svg-data-uri');
const marked = require('marked');
const renderer = new marked.Renderer();
const _ = require('lodash');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

const NotifyPlugin = require('notify-webpack-plugin');

const ASSET_NAME_PATTERN = 'static/[name]-[contenthash:6][ext]';

const packageJson = require('../package.json');

const splash = require('../icons/splash.json');

module.exports = (env) => {
  if (env.dev && env.WEBPACK_SERVE && (!fs.existsSync('key.pem') || !fs.existsSync('cert.pem'))) {
    console.log('Generating certificate');
    execSync('mkcert create-ca --validity 825');
    execSync('mkcert create-cert --validity 825 --key key.pem --cert cert.pem');
  }

  env.name = Object.keys(env)[0];
  ['release', 'beta', 'dev'].forEach((e) => {
    // set booleans based on env
    env[e] = Boolean(env[e]);
    if (env[e]) {
      env.name = e;
    }
  });

  let version = packageJson.version.toString();
  // We start the github build number from 1,000,000 so we don't get clashes with travis build numbers.
  const buildNumber = parseInt(process.env.GITHUB_RUN_NUMBER) + 1_000_000;
  if (env.beta && buildNumber) {
    version += `.${buildNumber}`;
  }
  if (!env.dev) {
    console.log('Building DIM version ' + version);
  }

  const buildTime = Date.now();

  const config = {
    mode: env.dev ? 'development' : 'production',

    entry: {
      main: './src/Index.tsx',
      browsercheck: './src/browsercheck.js',
      authReturn: './src/authReturn.ts',
    },

    // https://github.com/webpack/webpack-dev-server/issues/2758
    target: env.dev ? 'web' : 'browserslist',

    output: {
      path: path.resolve('./dist'),
      publicPath: '/',
      filename: env.dev ? '[name]-[fullhash].js' : '[name]-[contenthash:6].js',
      chunkFilename: env.dev ? '[name]-[fullhash].js' : '[name]-[contenthash:6].js',
      assetModuleFilename: ASSET_NAME_PATTERN,
      hashFunction: 'xxhash64',
    },

    // Dev server
    devServer: env.dev
      ? {
          host: process.env.DOCKER ? '0.0.0.0' : 'localhost',
          server: {
            type: 'https',
            options: {
              key: fs.readFileSync('key.pem'), // Private keys in PEM format.
              cert: fs.readFileSync('cert.pem'), // Cert chains in PEM format.
            },
          },
          devMiddleware: {
            stats: 'errors-only',
          },
          client: {
            overlay: false,
          },
          historyApiFallback: true,
          hot: 'only',
          liveReload: false,
        }
      : undefined,

    // Bail and fail hard on first error
    bail: !env.dev,

    stats: env.dev ? 'minimal' : 'normal',

    devtool: 'source-map',

    performance: {
      // Don't warn about too-large chunks
      hints: false,
    },

    optimization: {
      // We always want the chunk name, otherwise it's just numbers
      // chunkIds: 'named',
      // Extract the runtime into a separate chunk
      runtimeChunk: 'single',
      splitChunks: {
        chunks(chunk) {
          return chunk.name !== 'browsercheck';
        },
        automaticNameDelimiter: '-',
      },
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            ecma: 8,
            module: true,
            compress: { warnings: false, passes: 3, toplevel: true },
            mangle: { safari10: true, toplevel: true },
            output: { safari10: true },
          },
        }),
      ],
    },

    module: {
      strictExportPresence: true,

      rules: [
        {
          test: /\.js$/,
          exclude: [/node_modules/, /browsercheck\.js$/],
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
              },
            },
          ],
        },
        {
          // Optimize SVGs - mostly for destiny-icons.
          test: /\.svg$/,
          type: 'asset',
          generator: {
            dataUrl: (content) => svgToMiniDataURI(content.toString()),
          },
          parser: {
            dataUrlCondition: {
              maxSize: 5 * 1024, // only inline if less than 5kb
            },
          },
          use: [
            {
              loader: 'svgo-loader',
            },
          ],
        },
        {
          test: /\.(jpg|gif|png|eot|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 5 * 1024, // only inline if less than 5kb
            },
          },
        },
        // *.m.scss will have CSS Modules support
        {
          test: /\.m\.scss$/,
          use: [
            env.dev ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-modules-typescript-loader',
              options: {
                mode: process.env.CI ? 'verify' : 'emit',
              },
            },
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName:
                    env.dev || env.beta
                      ? '[name]_[local]-[contenthash:base64:5]'
                      : '[contenthash:base64:5]',
                  exportLocalsConvention: 'camelCaseOnly',
                },
                sourceMap: true,
                importLoaders: 2,
              },
            },
            'postcss-loader',
            'sass-loader',
          ],
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
                sourceMap: true,
              },
            },
            'postcss-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.css$/,
          use: [env.dev ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'],
        },
        // All files with a '.ts' or '.tsx' extension will be handled by 'babel-loader'.
        {
          test: /\.tsx?$/,
          exclude: [/testing/, /\.test\.ts$/],
          use: _.compact([
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
              },
            },
            env.dev
              ? null
              : {
                  loader: 'ts-loader',
                },
          ]),
        },
        // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
        {
          enforce: 'pre',
          test: /\.jsx?$/,
          loader: 'source-map-loader',
        },
        {
          test: /\.json/,
          include: /src(\/|\\)locale/,
          type: 'asset/resource',
          generator: {
            filename: '[name]-[contenthash:6][ext]',
          },
        },
        {
          type: 'javascript/auto',
          test: /\.wasm/,
        },
        {
          test: /CHANGELOG\.md$/,
          use: [
            {
              loader: 'html-loader',
            },
            {
              loader: 'markdown-loader',
              options: {
                renderer,
              },
            },
          ],
        },
      ],

      noParse: /manifests/,
    },

    resolve: {
      extensions: ['.js', '.json', '.ts', '.tsx', '.jsx'],

      alias: {
        app: path.resolve('./src/app/'),
        data: path.resolve('./src/data/'),
        images: path.resolve('./src/images/'),
        'destiny-icons': path.resolve('./destiny-icons/'),
      },

      fallback: {
        fs: false,
        net: false,
        tls: false,
      },
    },

    plugins: [
      new webpack.IgnorePlugin({ resourceRegExp: /caniuse-lite\/data\/regions/ }),

      new NotifyPlugin('DIM', !env.dev),

      new MiniCssExtractPlugin({
        filename: env.dev ? '[name]-[contenthash].css' : '[name]-[contenthash:6].css',
        chunkFilename: env.dev ? '[name]-[contenthash].css' : '[id]-[contenthash:6].css',
      }),

      new HtmlWebpackPlugin({
        inject: true,
        filename: 'index.html',
        template: 'src/index.html',
        chunks: ['main', 'browsercheck'],
        templateParameters: {
          version,
          date: new Date(buildTime).toString(),
          splash,
        },
        minify: env.dev
          ? false
          : {
              collapseWhitespace: true,
              keepClosingSlash: true,
              removeComments: false,
              removeRedundantAttributes: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              useShortDoctype: true,
            },
      }),

      new HtmlWebpackPlugin({
        inject: true,
        filename: 'return.html',
        template: 'src/return.html',
        chunks: ['authReturn'],
      }),

      new HtmlWebpackPlugin({
        inject: false,
        filename: '404.html',
        template: 'src/404.html',
      }),

      // Generate the .htaccess file (kind of an abuse of HtmlWebpack plugin just for templating)
      new HtmlWebpackPlugin({
        filename: '.htaccess',
        template: 'src/htaccess',
        inject: false,
        minify: false,
        templateParameters: {
          csp: csp(env.name),
        },
      }),

      // Generate a version info JSON file we can poll. We could theoretically add more info here too.
      new GenerateJsonPlugin('./version.json', {
        version,
        buildTime,
      }),

      new CopyWebpackPlugin({
        patterns: [
          { from: './src/manifest-webapp-6-2018.json' },
          // Only copy the manifests out of the data folder. Everything else we import directly into the bundle.
          { from: './src/data/d1/manifests', to: 'data/d1/manifests' },
          { from: `./icons/${env.name}/` },
          { from: `./icons/splash`, to: 'splash/' },
          { from: './src/safari-pinned-tab.svg' },
        ],
      }),

      new webpack.DefinePlugin({
        $DIM_VERSION: JSON.stringify(version),
        $DIM_FLAVOR: JSON.stringify(env.name),
        $DIM_BUILD_DATE: JSON.stringify(buildTime),
        // These are set from the GitHub secrets
        $DIM_WEB_API_KEY: JSON.stringify(process.env.WEB_API_KEY),
        $DIM_WEB_CLIENT_ID: JSON.stringify(process.env.WEB_OAUTH_CLIENT_ID),
        $DIM_WEB_CLIENT_SECRET: JSON.stringify(process.env.WEB_OAUTH_CLIENT_SECRET),
        $DIM_API_KEY: JSON.stringify(process.env.DIM_API_KEY),

        $BROWSERS: JSON.stringify(browserslist(packageJson.browserslist)),

        // Feature flags!

        // Print debug info to console about item moves
        '$featureFlags.debugMoves': JSON.stringify(!env.release),
        // Debug Service Worker
        '$featureFlags.debugSW': JSON.stringify(!env.release),
        // Send exception reports to Sentry.io on beta/prod only
        '$featureFlags.sentry': JSON.stringify(!env.dev),
        // Community-curated wish lists
        '$featureFlags.wishLists': JSON.stringify(true),
        // Show a banner for supporting a charitable cause
        '$featureFlags.issueBanner': JSON.stringify(false),
        // Show the triage tab in the item popup
        '$featureFlags.triage': JSON.stringify(env.dev),
        // Advanced Write Actions (inserting mods)
        '$featureFlags.awa': JSON.stringify(process.env.USER === 'brh'), // Only Ben has the keys...
        // Ability cooldowns in stats tooltips
        '$featureFlags.abilityCooldowns': JSON.stringify(false),
        // Item feed sidebar
        '$featureFlags.itemFeed': JSON.stringify(true),
      }),

      new LodashModuleReplacementPlugin({
        collections: true,
        memoizing: true,
        shorthands: true,
        flattening: true,
      }),
    ],
  };

  if (env.dev) {
    // In dev we use babel to compile TS, and fork off a separate typechecker
    config.plugins.push(
      new ForkTsCheckerWebpackPlugin({
        eslint: { files: './src/**/*.{ts,tsx,js,jsx}' },
      })
    );

    config.plugins.push(
      new WebpackNotifierPlugin({
        title: 'DIM',
        excludeWarnings: false,
        alwaysNotify: true,
        contentImage: path.join(__dirname, '../icons/release/favicon-96x96.png'),
      })
    );
    config.plugins.push(
      new ForkTsCheckerNotifierWebpackPlugin({
        title: 'DIM TypeScript',
        excludeWarnings: false,
        contentImage: path.join(__dirname, '../icons/release/favicon-96x96.png'),
      })
    );

    config.plugins.push(new ReactRefreshWebpackPlugin({ overlay: false }));
  } else {
    // env.beta and env.release
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: `./config/.well-known/android-config${env.release ? '' : '.beta'}.json`,
            to: '.well-known/assetlinks.json',
          },
          {
            from: `./config/.well-known/apple-config.json`,
            to: '.well-known/apple-app-site-association',
          },
        ],
      }),

      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: ['node_modules/.cache'],
      }),

      // Tell React we're in Production mode
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env': JSON.stringify({ NODE_ENV: 'production' }),
      }),

      // Generate a service worker
      new InjectManifest({
        include: [/\.(html|js|css|woff2|json|wasm)$/, /static\/.*\.(png|gif|jpg|svg)$/],
        exclude: [
          /version\.json/,
          /extension-dist/,
          /\.map$/,
          // Ignore both the webapp manifest and the d1-manifest files
          /data\/d1\/manifests/,
          /manifest-webapp/,
          // Android and iOS manifest
          /\.well-known/,
        ],
        swSrc: './src/service-worker.ts',
        swDest: 'service-worker.js',
      })
    );

    // Skip brotli compression for PR builds
    if (!process.env.PR_BUILD) {
      config.plugins.push(
        // Brotli-compress all assets. We used to gzip too but everything supports brotli now
        new CompressionPlugin({
          filename: '[path][base].br',
          algorithm: 'brotliCompress',
          exclude: /data\/d1\/manifests/,
          test: /\.js$|\.css$|\.html$|\.json$|\.map$|\.ttf$|\.eot$|\.svg$|\.wasm$/,
          compressionOptions: {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
            },
          },
          minRatio: 1,
        })
      );
    }
  }

  return config;
};
