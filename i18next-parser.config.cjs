const fs = require('fs');
const path = require('path');
const typescript = require('typescript');

// Dynamic Keys Regexen
// Split up for legibility

const Accounts = /Accounts.NoCharactersTitle/;
const Activities = /Activities.*/;
const AWA = /AWA.FailedToken/;
const Bucket = /Bucket.*/;
const BungieService = /BungieService.*/;
const Countdown = /Countdown.*/;
const Csv = /Csv.(EmptyFile|WrongFields)/;
const FarmingMode = /FarmingMode.*/;
const Filter = /Filter.*/;
const Glyphs = /Glyphs.*/;
const Help = /Help.CannotMove/;
const Hotkey = /Hotkey.(Enter|Tab)/;
const KillType = /KillType.*/;
const ItemService = /ItemService.(Classified|NotEnoughRoomGeneral)/;
const LB = /LB.SelectModsCount*/;
const LoadoutAnalysis = /LoadoutAnalysis.*/;
const LoadoutBuilder = /LoadoutBuilder.*/;
const Sockets = /Sockets.*/;
const Loadouts = /Loadouts.*/;
const Organizer = /Organizer.*/;
const Progress = /Progress.Percent*/;
const Stats = /Stats.WeaponPart/;
const Tags = /Tags.*/;
const Triage = /Triage.*/;
const WishListRoll = /WishListRoll.*/;
const nospace = /no-space/;
const wronglevel = /wrong-level/;

const DynamicKeys = new RegExp(
  `${Accounts.source}|${Activities.source}|${AWA.source}|${Bucket.source}|${BungieService.source}|${Countdown.source}|${Csv.source}|${FarmingMode.source}|${Filter.source}|${Glyphs.source}|${Help.source}|${Hotkey.source}|${KillType.source}|${ItemService.source}|${LB.source}|${LoadoutAnalysis.source}|${LoadoutBuilder.source}|${Sockets.source}|${Loadouts.source}|${Organizer.source}|${Progress.source}|${Stats.source}|${Tags.source}|${Triage.source}|${WishListRoll.source}|${nospace.source}|${wronglevel.source}`,
);

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
