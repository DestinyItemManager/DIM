module.exports = {
  input: ['src/app/**/*.{js,jsx,ts,tsx}', 'src/browsercheck.js'],
  output: './',
  options: {
    debug: false,
    removeUnusedKeys: true,
    sort: true,
    func: {
      list: ['t', 'i18next.t', 'tl', 'DimError'],
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
    contextList: {
      // contexts
      compact: { list: ['compact'], fallback: false },
      max: { list: ['Max'] },
      // dynamic keys
      buckets: {
        list: ['General', 'Inventory', 'Postmaster', 'Progress', 'Unknown'],
        fallback: false,
        separator: false,
      },
      cooldowns: {
        list: ['Grenade', 'Melee', 'Super'],
        fallback: false,
        separator: false,
      },
      difficulty: {
        list: ['Normal', 'Hard'],
        fallback: false,
        separator: false,
      },
      minMax: {
        list: ['Min', 'Max'],
        fallback: false,
        separator: false,
      },
      platforms: {
        list: ['PlayStation', 'Stadia', 'Steam', 'Xbox'],
        fallback: false,
        separator: false,
      },
      progress: {
        list: ['Bounties', 'Items', 'Quests'],
        fallback: false,
        separator: false,
      },
      sockets: {
        list: [
          'Mod',
          'Ability',
          'Shader',
          'Ornament',
          'Fragment',
          'Aspect',
          'Projection',
          'Transmat',
          'Super',
        ],
        fallback: false,
        separator: false,
      },
    },
  },
};
