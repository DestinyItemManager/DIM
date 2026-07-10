/**
 * Rspack config for the browser ablation bench. BENCH BRANCH ONLY.
 *
 * A minimal mirror of the production config (same babel-loader + ts-loader
 * chain, same browserslist target, same defines) that bundles only the
 * ablation harness page and its worker, so the numbers reflect the code the
 * real app ships.
 *
 *   rspack --config ./config/webpack.ablation.ts --node-env=production
 */
import { type Configuration, rspack } from '@rspack/core';
import browserslist from 'browserslist';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { resolve } from 'node:path';
import packageJson from '../package.json' with { type: 'json' };
import { makeFeatureFlags } from './feature-flags.ts';

export default (): Configuration => {
  const env = { release: false, beta: true, dev: false, pr: false };

  const config: Configuration = {
    mode: 'production',
    target: 'browserslist',

    entry: {
      ablation: './src/ablation-bench/main.ts',
    },

    output: {
      path: resolve('./dist-ablation'),
      publicPath: '',
      filename: '[name].js',
      chunkFilename: '[name].js',
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: [/testing/, /\.test\.ts$/],
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
              },
            },
            {
              loader: 'ts-loader',
              options: {
                // The harness only pulls in the worker graph; don't typecheck
                // the whole app.
                transpileOnly: true,
              },
            },
          ],
        },
      ],
    },

    resolve: {
      extensions: ['.js', '.json', '.ts', '.tsx', '.jsx'],
      tsConfig: resolve('./tsconfig.json'),
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './src/ablation-bench/index.html',
        chunks: ['ablation'],
      }),
      new rspack.DefinePlugin({
        $DIM_VERSION: JSON.stringify('0.0.0-ablation'),
        $DIM_FLAVOR: JSON.stringify('beta'),
        $DIM_BUILD_DATE: JSON.stringify(Date.now()),
        $DIM_WEB_API_KEY: JSON.stringify(''),
        $DIM_WEB_CLIENT_ID: JSON.stringify(''),
        $DIM_WEB_CLIENT_SECRET: JSON.stringify(''),
        $DIM_API_KEY: JSON.stringify(''),
        $ANALYTICS_PROPERTY: JSON.stringify(''),
        $PUBLIC_PATH: JSON.stringify(''),
        $BROWSERS: JSON.stringify(browserslist(packageJson.browserslist)),
        ...Object.fromEntries(
          Object.entries(makeFeatureFlags(env)).map(([key, value]) => [
            `$featureFlags.${key}`,
            JSON.stringify(value),
          ]),
        ),
      }),
    ],
  };

  return config;
};
