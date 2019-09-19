// const fs = require('fs');
// const chalk = require('chalk');

module.exports = {
  input: ['src/app/**/*.{js,jsx,ts,tsx}'],
  output: './',
  options: {
    debug: false,
    removeUnusedKeys: true,
    sort: true,
    func: {
      list: ['t', 'i18next.t'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    lngs: ['en'],
    ns: ['translation'],
    defaultLng: 'en',
    resource: {
      loadPath: 'src/locale/dim.json',
      savePath: 'src/locale/dim.json',
      jsonIndent: 2,
      lineEnding: '\n'
    },
    context: false
  }
  /*,
  transform: function customTransform(file, enc, done) {
    'use strict';
    const parser = this.parser;
    const content = fs.readFileSync(file.path, enc);
    let count = 0;

    parser.parseFuncFromString(content, { list: ['t'] }, (key, options) => {
      parser.set(key);
      ++count;
    });

    if (count > 0) {
      console.log(
        `i18next-scanner: count=${chalk.cyan(count)}, file=${chalk.yellow(
          JSON.stringify(file.relative)
        )}`
      );
    }

    done();
  }
  */
};
