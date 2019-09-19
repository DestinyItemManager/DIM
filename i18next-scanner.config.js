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
  },
  transform: function customTransform(file, enc, done) {
    'use strict';
    const parser = this.parser;
    const content = fs.readFileSync(file.path, enc);

    // On t() that depend on interpolation e.g. t('Ghosts.${location}')
    // we instead of adding a bunch of comments add an array called validSubkeys, set to the values of subkeys

    // t(`Ghost.${location}`, { validSubkeys: ['crucible', 'dreaming', 'edz', 'gambit', 'io', 'leviathan', 'mars', 'mercury', 'nessus', 'strikes', 'tangled', 'titan'] } );

    // then we interpolate it manually here.

    // we should also check if context has a gender on it and provide the `_male` and `_female` contexts automatically
    // we should also check if count is used and automatically save _plural as well
    // and add another array for validContext e.g
    // t('Stats.TierProgress', { validContext: [ '', 'Max' ] } )

    /*
      var results = content.match(/ t\(("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')?([^}]*)/gm) || [];
      if (results.length > 0) console.log(results);
    */

    parser.parseFuncFromString(content); // parse with defaults values
    done();
  }
};
