const fs = require('fs');

const de = require('./locale/de/dim.json');
const en = require('./locale/dim.json');
const esMX = require('./locale/es-mx/dim.json');
const es = require('./locale/es/dim.json');
const fr = require('./locale/fr/dim.json');
const it = require('./locale/it/dim.json');
const ja = require('./locale/ja/dim.json');
const ko = require('./locale/ko/dim.json');
const pl = require('./locale/pl/dim.json');
const ptBR = require('./locale/pt-br/dim.json');
const ru = require('./locale/ru/dim.json');
const zhCHS = require('./locale/zh-chs/dim.json');
const zhCHT = require('./locale/zh-cht/dim.json');

function getI18nKey(key) {
  let key1 = key.split('.')[0];
  let key2 = key.split('.')[1];
  return `  en: "${en[key1][key2]}",
  de: "${de[key1]?.[key2] ?? en[key1][key2]}",
  es: "${es[key1]?.[key2] ?? en[key1][key2]}",
  'es-mx': "${esMX[key1]?.[key2] ?? en[key1][key2]}",
  fr: "${fr[key1]?.[key2] ?? en[key1][key2]}",
  it: "${it[key1]?.[key2] ?? en[key1][key2]}",
  ja: "${ja[key1]?.[key2] ?? en[key1][key2]}",
  ko: "${ko[key1]?.[key2] ?? en[key1][key2]}",
  pl: "${pl[key1]?.[key2] ?? en[key1][key2]}",
  'pt-br': "${ptBR[key1]?.[key2] ?? en[key1][key2]}",
  ru: "${ru[key1]?.[key2] ?? en[key1][key2]}",
  'zh-chs': "${zhCHS[key1]?.[key2] ?? en[key1][key2]}",
  'zh-cht': "${zhCHT[key1]?.[key2] ?? en[key1][key2]}",\n};`;
}

var browserCheckUtils = `export const supportedLanguages = [
  'en',
  'de',
  'es',
  'es-mx',
  'fr',
  'it',
  'ja',
  'ko',
  'pl',
  'pt-br',
  'ru',
  'zh-chs',
  'zh-cht',
];

export const unsupported = {
${getI18nKey('Browsercheck.Unsupported')}

export const steamBrowser = {
${getI18nKey('Browsercheck.Steam')}
`;

fs.writeFile('../src/browsercheck-utils.js', browserCheckUtils, (err) => {
  if (err) {
    //infoLog(err)
  }
});
