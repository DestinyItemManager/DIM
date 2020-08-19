module.exports = {
  input: ['src/app/**/*.{js,jsx,ts,tsx}'],
  output: './',
  options: {
    debug: false,
    removeUnusedKeys: true,
    sort: true,
    func: {
      list: ['t', 'i18next.t', 'tl'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    lngs: ['en'],
    ns: ['translation'],
    defaultLng: 'en',
    resource: {
      loadPath: 'config/i18n.json',
      savePath: 'src/locale/dim.json',
      jsonIndent: 2,
      lineEnding: '\n',
    },
    context: false,
  },
};
