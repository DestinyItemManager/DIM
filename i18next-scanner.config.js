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
    context: true,
    contextFallback: true,
    contextDefaultValues: ['male', 'female'],
    contextList: {
      // contexts
      compact: { list: ['compact'], fallback: false },
      max: { list: ['Max'], fallback: true },
      // dynamic keys
      buckets: {
        list: ['General', 'Inventory', 'Postmaster', 'Progress', 'Unknown'],
        fallback: false,
        separator: '',
      },
      cooldowns: {
        list: ['Grenade', 'Melee', 'Super'],
        fallback: false,
        separator: '',
      },
      difficulty: {
        list: ['Normal', 'Hard'],
        fallback: false,
        separator: '',
      },
      ghost_locations: {
        list: [
          'crucible',
          'dreaming',
          'edz',
          'gambit',
          'io', // dcv
          'leviathan', // dcv
          'mars', // dcv
          'mercury', // dcv
          'nessus',
          'strikes',
          'tangled',
          'titan', // dcv
          'moon',
        ],
        fallback: false,
        separator: '',
      },
      minMax: {
        list: ['Min', 'Max'],
        fallback: false,
        separator: '',
      },
      platforms: {
        list: ['Blizzard', 'PlayStation', 'Steam', 'Stadia', 'Xbox'],
        fallback: false,
        separator: '',
      },
    },
  },
};
