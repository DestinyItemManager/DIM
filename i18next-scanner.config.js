const fs = require('fs');

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

    var results = content.match(/ t\(("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')?([^}]*)/gm) || [];
    if (results.length > 0) console.log(results);
    done();
  }
  */
};
