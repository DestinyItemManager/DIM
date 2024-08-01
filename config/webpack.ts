import webpack from 'webpack';

import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import browserslist from 'browserslist';
import { execSync } from 'child_process';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ForkTsCheckerNotifierWebpackPlugin from 'fork-ts-checker-notifier-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import fs from 'fs';
import GenerateJsonPlugin from 'generate-json-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import _ from 'lodash';
import LodashModuleReplacementPlugin from 'lodash-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import svgToMiniDataURI from 'mini-svg-data-uri';
import path from 'path';
import PostCSSAssetsPlugin from 'postcss-assets-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import 'webpack-dev-server';
import WebpackNotifierPlugin from 'webpack-notifier';
import { InjectManifest } from 'workbox-webpack-plugin';
import zlib from 'zlib';
import csp from './content-security-policy';
import { makeFeatureFlags } from './feature-flags';

import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

import { StatsWriterPlugin } from 'webpack-stats-plugin';
import NotifyPlugin from './notify-webpack-plugin';

const ASSET_NAME_PATTERN = 'static/[name]-[contenthash:6][ext]';

import packageJson from '../package.json';
import createWebAppManifest from './manifest-webapp';

import splash from '../icons/splash.json';

// https://stackoverflow.com/questions/69584268/what-is-the-type-of-the-webpack-config-function-when-it-comes-to-typescript
type CLIValues = boolean | string;
type EnvValues = Record<string, CLIValues | Record<string, Env>>;
interface Env extends EnvValues {
  release: boolean;
  beta: boolean;
  dev: boolean;
  pr: boolean;
  name: 'release' | 'beta' | 'dev' | 'pr';
}
type Argv = Record<string, CLIValues>;
export interface WebpackConfigurationGenerator {
  (env?: Env, argv?: Argv): webpack.Configuration | Promise<webpack.Configuration>;
}

export default (env: Env) => {
  env.name = Object.keys(env)[0] as Env['name'];
  (['release', 'beta', 'dev', 'pr'] as const).forEach((e) => {
    // set booleans based on env
    env[e] = Boolean(env[e]);
    if (env[e]) {
      env.name = e;
    }
  });

  if (env.dev && env.WEBPACK_SERVE && (!fs.existsSync('key.pem') || !fs.existsSync('cert.pem'))) {
    console.log('Generating certificate');
    execSync('mkcert create-ca --validity 825');
    execSync('mkcert create-cert --validity 825 --key key.pem --cert cert.pem');
  }

  let version = env.dev ? packageJson.version.toString() : process.env.VERSION;

  if (!env.dev) {
    console.log('Building DIM version ' + version);
  }

  const buildTime = Date.now();
  const publicPath = process.env.PUBLIC_PATH ?? '/';

  const featureFlags = makeFeatureFlags(env);
  const contentSecurityPolicy = csp(env.name, featureFlags, version);

  const analyticsProperty = env.release ? 'G-1PW23SGMHN' : 'G-MYWW38Z3LR';
  const jsFilenamePattern = env.dev ? '[name]-[fullhash].js' : '[name]-[contenthash:8].js';
  const cssFilenamePattern = env.dev ? '[name]-[fullhash].css' : '[name]-[contenthash:8].css';

  const config: webpack.Configuration = {
    mode: env.dev ? ('development' as const) : ('production' as const),

    entry: {
      main: './src/Index.tsx',
      browsercheck: './src/browsercheck.js',
      earlyErrorReport: './src/earlyErrorReport.js',
      authReturn: './src/authReturn.ts',
      backup: './src/backup.ts',
    },

    // https://github.com/webpack/webpack-dev-server/issues/2758
    target: env.dev ? 'web' : 'browserslist',

    output: {
      path: path.resolve('./dist'),
      publicPath,
      filename: jsFilenamePattern,
      chunkFilename: jsFilenamePattern,
      assetModuleFilename: ASSET_NAME_PATTERN,
      hashFunction: 'xxhash64',
    },

    // Dev server
    devServer: env.dev
      ? {
          host: process.env.DOCKER ? '0.0.0.0' : 'localhost',
          allowedHosts: 'all',
          server: {
            type: 'spdy',
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
          headers: (req) => {
            // This mirrors what's in .htaccess - headers for html paths, COEP for JS.
            const headers: Record<string, string | string[]> = req.baseUrl.match(/^[^.]+$/)
              ? {
                  'Content-Security-Policy': contentSecurityPolicy,
                  // credentialless is only supported by chrome but require-corp blocks Bungie.net messages
                  // Disabled for now as it blocks Google fonts
                  //'Cross-Origin-Embedder-Policy': 'credentialless',
                  //'Cross-Origin-Opener-Policy': 'same-origin',
                }
              : req.baseUrl.match(/\.js$/)
                ? {
                    // credentialless is only supported by chrome but require-corp blocks Bungie.net messages
                    //'Cross-Origin-Embedder-Policy': 'require-corp',
                  }
                : {};

            return headers;
          },
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
          return chunk.name !== 'browsercheck' && chunk.name !== 'earlyErrorReport';
        },
        automaticNameDelimiter: '-',
      },
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            ecma: 2020,
            module: true,
            compress: {
              passes: 3,
              toplevel: true,
              unsafe: true,
              unsafe_math: true,
              unsafe_proto: true,
              pure_getters: true,
              pure_funcs: [
                'JSON.parse',
                'Object.values',
                'Object.keys',
                'Object.groupBy',
                'Object.fromEntries',
                'Map.groupBy',
                'Map',
                'Set',
                'BigInt',
              ],
            },
            mangle: { toplevel: true },
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
          exclude: /data\/webfonts\//,
          type: 'asset',
          generator: {
            dataUrl: (content: any) => svgToMiniDataURI(content.toString()),
          },
          parser: {
            dataUrlCondition: {
              maxSize: 5 * 1024, // only inline if less than 5kb
            },
          },
          use: env.dev
            ? []
            : [
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
                  localIdentName: !env.release
                    ? '[name]_[local]-[contenthash:base64:8]'
                    : '[contenthash:base64:8]',
                  exportLocalsConvention: 'camelCaseOnly',
                  // TODO: It's possible that setting this to true would allow
                  // us to eliminate some original CSS names that still get into
                  // the bundle, but it breaks css-modules-typescript-loader so
                  // we'd need to fork/replace it.
                  namedExport: false,
                },
                importLoaders: 2,
              },
            },
            'postcss-loader',
            { loader: 'sass-loader', options: { sassOptions: { quietDeps: true } } },
          ],
        },
        // Regular *.scss are global
        {
          test: /\.scss$/,
          exclude: /\.m\.scss$/,
          use: [
            env.dev ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            { loader: 'sass-loader', options: { sassOptions: { quietDeps: true } } },
          ],
        },
        {
          test: /\.css$/,
          use: [
            env.dev ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
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
          include: /(src(\/|\\)locale)|(i18n\.json)/,
          type: 'asset/resource',
          generator: {
            filename: '[name]-[contenthash:8][ext]',
          },
        },
        {
          // Force webfonts to be separate files instead of having small ones inlined into CSS
          test: /data\/webfonts\//,
          type: 'asset/resource',
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
            },
          ],
        },
      ],

      noParse: /manifests/,
    },

    resolve: {
      extensions: ['.js', '.json', '.ts', '.tsx', '.jsx'],

      plugins: [new TsconfigPathsPlugin()],

      alias: {
        'textarea-caret': path.resolve('./src/app/utils/textarea-caret'),
        lodash: 'lodash-es',
      },

      fallback: {
        fs: false,
        net: false,
        tls: false,
      },
    },

    plugins: [],
  };

  const plugins: any[] = [
    new webpack.IgnorePlugin({ resourceRegExp: /caniuse-lite\/data\/regions/ }),

    new NotifyPlugin('DIM', !env.dev),

    new MiniCssExtractPlugin({
      filename: cssFilenamePattern,
      chunkFilename: cssFilenamePattern,
    }),

    // Compress CSS after bundling so we can optimize across rules
    new PostCSSAssetsPlugin({
      test: /\.css$/,
      log: false,
      plugins: [
        // Sort media queries so they can be merged by cssnano
        require('postcss-sort-media-queries')({
          sort: 'desktop-first',
        }),
        require('cssnano')({
          preset: [
            'default',
            {
              autoprefixer: false,
              // We've already run svgo on all images
              svgo: false,
            },
          ],
        }),
      ],
    }),

    // TODO: prerender?
    new HtmlWebpackPlugin({
      inject: false,
      filename: 'index.html',
      template: 'src/index.html',
      chunks: ['earlyErrorReport', 'main', 'browsercheck'],
      templateParameters: {
        version,
        date: new Date(buildTime).toString(),
        splash,
        analyticsProperty,
        publicPath,
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
      inject: true,
      filename: 'backup.html',
      template: 'src/backup.html',
      chunks: ['backup'],
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
        publicPath: publicPath.replace('/', ''),
        csp: contentSecurityPolicy,
      },
    }),

    // Generate a version info JSON file we can poll. We could theoretically add more info here too.
    new GenerateJsonPlugin('./version.json', {
      version,
      buildTime,
    }),

    // The web app manifest controls how our app looks when installed.
    new GenerateJsonPlugin('./manifest-webapp.json', createWebAppManifest(publicPath)),

    new CopyWebpackPlugin({
      patterns: [
        // Only copy the manifests out of the data folder. Everything else we import directly into the bundle.
        { from: './src/data/d1/manifests', to: 'data/d1/manifests' },
        { from: `./icons/${env.name}/` },
        { from: `./icons/splash`, to: 'splash/' },
        { from: `./icons/screenshots`, to: 'screenshots/' },
        { from: './src/safari-pinned-tab.svg' },
        { from: './src/nuke.php' },
        { from: './src/robots.txt' },
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
      $ANALYTICS_PROPERTY: JSON.stringify(analyticsProperty),
      $PUBLIC_PATH: JSON.stringify(publicPath),

      $BROWSERS: JSON.stringify(browserslist(packageJson.browserslist)),

      // Feature flags!
      ...Object.fromEntries(
        Object.entries(featureFlags).map(([key, value]) => [
          `$featureFlags.${key}`,
          JSON.stringify(value),
        ]),
      ),
    }),

    new LodashModuleReplacementPlugin({
      collections: true,
      memoizing: true,
      shorthands: true,
      flattening: true,
    }),
  ];

  if (env.dev) {
    // In dev we use babel to compile TS, and fork off a separate typechecker
    plugins.push(
      new ForkTsCheckerWebpackPlugin({
        eslint: { files: './src/**/*.{ts,tsx,cjs,mjs,cts,mts,js,jsx}' },
      }),
    );

    if (process.env.SNORETOAST_DISABLE) {
      console.log("Disabling build notifications as 'SNORETOAST_DISABLE' was defined");
    } else {
      plugins.push(
        new WebpackNotifierPlugin({
          title: 'DIM',
          excludeWarnings: false,
          alwaysNotify: true,
          contentImage: path.join(__dirname, '../icons/release/favicon-96x96.png'),
        }),
      );
      plugins.push(
        new ForkTsCheckerNotifierWebpackPlugin({
          title: 'DIM TypeScript',
          excludeWarnings: false,
        }),
      );
    }

    plugins.push(new ReactRefreshWebpackPlugin({ overlay: false }));
  } else {
    // env.beta and env.release
    plugins.push(
      new StatsWriterPlugin({
        filename: '../webpack-stats.json',
        stats: {
          assets: true,
          entrypoints: true,
          chunks: true,
          modules: true,
          excludeAssets: [
            /data\/d1\/manifests\/d1-manifest-..(-br)?.json(.br|.gz)?/,
            /^(?!en).+.json/,
            /webpack-stats.json/,
            /screenshots\//,
          ],
        },
      }),

      new CopyWebpackPlugin({
        patterns: [
          {
            from: `./config/.well-known/android-config${env.release ? '' : '.beta'}.json`,
            to: '.well-known/assetlinks.json',
          },
          {
            from: `./config/.well-known/apple-config.json`,
            to: '.well-known/apple-app-site-association',
            toType: 'file',
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
        include: [/\.(html|js|css|woff2|json|wasm)$/, /static\/(?!fa-).*\.(png|gif|jpg|svg)$/],
        exclude: [
          /version\.json/,
          // Ignore both the webapp manifest and the d1-manifest files
          /data\/d1\/manifests/,
          /manifest-webapp/,
          // Android and iOS manifest
          /\.well-known/,
          /screenshots\//,
        ],
        swSrc: './src/service-worker.ts',
        swDest: 'service-worker.js',
      }),
    );

    // Skip brotli compression for PR builds
    if (!process.env.PR_BUILD) {
      plugins.push(
        // Brotli-compress all assets. We used to gzip too but everything supports brotli now
        new CompressionPlugin({
          filename: '[path][base].br',
          algorithm: 'brotliCompress',
          exclude: /data\/d1\/manifests/,
          // Skip .woff and .woff2, they're already well compressed
          test: /\.js$|\.css$|\.html$|\.json$|\.map$|\.ttf$|\.eot$|\.svg$|\.wasm$/,
          compressionOptions: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
          },
          minRatio: Infinity,
        }),
      );
    }
  }

  config.plugins = plugins;

  return config;
};
