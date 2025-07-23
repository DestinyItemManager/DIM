const fs = require('fs');
const path = require('path');
const typescript = require('typescript');

// Dynamic Keys Regexen
// Split up for legibility

const regexConstants = [
  { name: 'Accounts', pattern: /Accounts.NoCharactersTitle/ },
  { name: 'Activities', pattern: /Activities.*/ },
  { name: 'AWA', pattern: /AWA.FailedToken/ },
  { name: 'Bucket', pattern: /Bucket.*/ },
  { name: 'BungieService', pattern: /BungieService.*/ },
  { name: 'Countdown', pattern: /Countdown.*/ },
  { name: 'Csv', pattern: /Csv.(EmptyFile|WrongFields)/ },
  { name: 'FarmingMode', pattern: /FarmingMode.*/ },
  { name: 'Filter', pattern: /Filter.*/ },
  { name: 'Glyphs', pattern: /Glyphs.*/ },
  { name: 'Help', pattern: /Help.CannotMove/ },
  { name: 'Hotkey', pattern: /Hotkey.(Enter|Tab)/ },
  { name: 'KillType', pattern: /KillType.*/ },
  { name: 'ItemService', pattern: /ItemService.(Classified|NotEnoughRoomGeneral)/ },
  { name: 'LB', pattern: /LB.SelectModsCount*/ },
  { name: 'LoadoutAnalysis', pattern: /LoadoutAnalysis.*/ },
  { name: 'LoadoutBuilder', pattern: /LoadoutBuilder.*/ },
  { name: 'Sockets', pattern: /Sockets.*/ },
  { name: 'Loadouts', pattern: /Loadouts.*/ },
  { name: 'Organizer', pattern: /Organizer.*/ },
  { name: 'Progress', pattern: /Progress.Percent*/ },
  { name: 'Stats', pattern: /Stats.WeaponPart/ },
  { name: 'Tags', pattern: /Tags.*/ },
  { name: 'Triage', pattern: /Triage.*/ },
  { name: 'WishListRoll', pattern: /WishListRoll.*/ },
  { name: 'nospace', pattern: /no-space/ },
  { name: 'wronglevel', pattern: /wrong-level/ },
];

const DynamicKeys = new RegExp(regexConstants.map((r) => r.pattern.source).join('|'));

module.exports = {
  input: ['src/app/**/*.{js,jsx,ts,tsx,cjs,mjs,cts,mts}', 'src/browsercheck.js'],

  output: 'src/locale/$LOCALE.json',

  locales: ['de', 'en', 'es', 'esMX', 'fr', 'it', 'ja', 'ko', 'pl', 'ptBR', 'ru', 'zhCHS', 'zhCHT'],

  defaultLocale: 'en',
  defaultNamespace: 'translation',

  // Separators
  namespaceSeparator: ':',
  keySeparator: '.',
  contextSeparator: '_',
  pluralSeparator: '_',

  createOldCatalogs: false,
  keepRemoved: [DynamicKeys],
  sort: true,
  verbose: false,
  functions: ['t', 'tl', 'DimError'],
  indentation: 2,
  lineEnding: '\n',
  context: true,
  contextFallback: true,
  contextDefaultValues: ['male', 'female'],
  allowDynamicKeys: true,
  catalogs: ['config/i18n.json'],
};
