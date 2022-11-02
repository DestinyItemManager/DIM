const fs = require('fs');

module.exports = {
  input: ['src/app/**/*.{js,jsx,ts,tsx}', 'src/browsercheck.js'],
  output: './',
  options: {
    debug: false,
    removeUnusedKeys: true,
    sort: true,
    func: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    lngs: ['en'],
    ns: ['translation'],
    defaultLng: 'en',
    resource: {
      loadPath: 'config/i18n.json',
      savePath: 'src/locale/en.json',
      jsonIndent: 2,
      lineEnding: '\n',
    },
    context: true,
    contextFallback: true,
    contextDefaultValues: ['male', 'female'],
    allowDynamicKeys: true,
  },
  transform: function customTransform(file, enc, done) {
    'use strict';
    const parser = this.parser;

    const content = fs.readFileSync(file.path, enc);

    // prettier-ignore
    const contexts = {
      compact: ['compact'],
      max: ['Max'],
    };

    // prettier-ignore
    const keys = {
      buckets: { list: ['General', 'Inventory', 'Postmaster', 'Progress', 'Unknown'] },
      cooldowns: { list: ['Grenade', 'Melee', 'Super'] },
      difficulty: { list: ['Normal', 'Hard'] },
      minMax: { list: ['Min', 'Max'] },
      progress: { list: ['Bounties', 'Items', 'Quests'] },
      sockets: { list: ['Mod', 'Ability', 'Shader', 'Ornament', 'Fragment', 'Aspect', 'Projection', 'Transmat', 'Super'] },
      unsupported: { list: ['Unsupported', 'Steam'] },
    };

    parser.parseFuncFromString(content, { list: ['t', 'tl', 'DimError'] }, (key, options) => {
      if (options.metadata?.context) {
        // Add context based on metadata
        delete options.context;
        const context = contexts[options.metadata?.context];
        parser.set(key, options);
        for (let i = 0; i < context?.length; i++) {
          parser.set(`${key}${parser.options.contextSeparator}${context[i]}`, options);
        }
      }

      if (options.metadata?.keys) {
        // Add keys based on metadata (dynamic or otherwise)
        const list = keys[options.metadata?.keys].list;
        for (let i = 0; i < list?.length; i++) {
          parser.set(`${key}${list[i]}`, options);
        }
      }

      // Add all other non-metadata related keys w/ default options
      if (!options.metadata) {
        parser.set(key, options);
      }
    });

    done();
  },
};
