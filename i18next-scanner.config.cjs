const fs = require('fs');
const path = require('path');
const typescript = require('typescript');

module.exports = {
  input: ['src/app/**/*.{js,jsx,ts,tsx,cjs,mjs,cts,mts}', 'src/browsercheck.js'],
  output: './',
  options: {
    compatibilityJSON: 'v4',
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
    const tsExts = ['.ts', '.tsx'];
    const parser = this.parser;

    const { base, ext } = path.parse(file.path);
    let content = fs.readFileSync(file.path, enc);
    const isTs = tsExts.includes(ext) && !base.includes('.d.ts');

    if (isTs) {
      const { outputText } = typescript.transpileModule(content, {
        compilerOptions: {
          target: 'es2018',
          jsx: 'preserve',
        },
        fileName: path.basename(file.path),
      });
      content = outputText;
    }

    // prettier-ignore
    const contexts = {
      compact: ['compact'],
      max: ['Max'],
    };

    // prettier-ignore
    const keys = {
      buckets: { list: ['General', 'Inventory', 'Postmaster', 'Progress', 'Unknown'] },
      difficulty: { list: ['Normal', 'Hard'] },
      progress: { list: ['Bounties', 'Items', 'Quests'] },
      sockets: { list: ['Mod', 'Ability', 'Shader', 'Ornament', 'Fragment', 'Aspect', 'Projection', 'Transmat', 'Super'] }
    };
    const dimTransformer = (key, options) => {
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
    };

    parser.parseFuncFromString(content, { list: ['t', 'tl', 'DimError'] }, dimTransformer);

    done();
  },
};
