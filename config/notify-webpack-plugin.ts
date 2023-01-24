// Originally from https://github.com/joshhunt/notify-webpack-plugin/, converted to TypeScript

import { Compiler, Stats } from 'webpack';

import chalk from 'chalk';

export default class NotifyPlugin {
  name: string;
  firstRun: boolean;
  hideChildren: boolean;

  constructor(name: string, isProd?: boolean) {
    this.name = name;
    this.firstRun = true;
    this.hideChildren = !isProd;
  }

  apply(compiler: Compiler) {
    // Hack to get rid of the 'Child extract-text...' log spam
    compiler.hooks.done.tap('NotifyPlugin', (stat) => {
      stat.compilation.children = this.hideChildren ? [] : stat.compilation.children;
    });

    compiler.hooks.compile.tap('NotifyPlugin', () => {
      const action = this.firstRun ? 'starting to build' : 'updating';
      console.log('==> ' + chalk.cyan(`Webpack is ${action} ${this.name}...`));
    });

    compiler.hooks.done.tap('NotifyPlugin', this.onDone.bind(this));
  }

  onDone(rawWebpackStats: Stats) {
    const { time } = rawWebpackStats.toJson({ timings: true });
    const action = this.firstRun ? 'building' : 'updating';
    console.log('==> ' + chalk.green(`Webpack finished ${action} ${this.name} in ${time}ms`));

    this.firstRun = false;
  }
}
