const fs = require('fs');
const path = require('path');
const typescript = require('typescript');

// Load the shared key registry from its TS source. It's pure data (type-only imports), so we can transpile and eval it standalone.
function loadI18nRegistry() {
  const src = fs.readFileSync(path.resolve(__dirname, 'src/app/i18n-keys.ts'), 'utf8');
  const { outputText } = typescript.transpileModule(src, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2019,
    },
  });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(mod, mod.exports, require);
  return mod.exports;
}

const { I18N_KEYS, I18N_CONTEXTS } = loadI18nRegistry();

// Emit `Prefix.Value` for every registered key. Done from the transform rather than a custom
// flush, which would override the scanner's default resource-writing. Runs once.
let registryEmitted = false;
function emitRegistryKeys(parser) {
  if (registryEmitted) {
    return;
  }
  registryEmitted = true;
  for (const [prefix, values] of Object.entries(I18N_KEYS)) {
    for (const value of values) {
      parser.set(`${prefix}.${value}`);
    }
  }
}

module.exports = {
  input: ['src/app/**/*.{js,jsx,ts,tsx,cjs,mjs,cts,mts}', 'src/browsercheck.js'],
  // build/i18n.cjs points this at a temp dir so it can diff the result and only
  // overwrite src/locale/en.json on a real change (see that file for why).
  output: process.env.I18N_OUTPUT_DIR || './',
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
  },
  transform(file, enc, done) {
    const parser = this.parser;
    emitRegistryKeys(parser);

    const { base, ext } = path.parse(file.path);
    let content = fs.readFileSync(file.path, enc);
    const isTs = ['.ts', '.tsx'].includes(ext) && !base.includes('.d.ts');

    if (isTs) {
      content = typescript.transpileModule(content, {
        compilerOptions: { target: 'es2018', jsx: 'preserve' },
        fileName: path.basename(file.path),
      }).outputText;
    }

    const transformer = (key, options) => {
      const contexts = I18N_CONTEXTS[key];
      if (contexts) {
        // Drop the runtime-dynamic context so the scanner's native male/female expansion
        // doesn't kick in; keep the rest of options so plurals still expand per variant.
        delete options.context;
        parser.set(key, options);
        for (const ctx of contexts) {
          parser.set(`${key}${parser.options.contextSeparator}${ctx}`, options);
        }
      } else {
        parser.set(key, options);
      }
    };

    parser.parseFuncFromString(content, { list: ['t', 'tl', 'DimError'] }, transformer);

    done();
  },
};
