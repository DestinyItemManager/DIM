const fs = require('fs');

const de = require('./locale/de.json');
const en = require('./locale/en.json');
const esMX = require('./locale/esMX.json');
const es = require('./locale/es.json');
const fr = require('./locale/fr.json');
const it = require('./locale/it.json');
const ja = require('./locale/ja.json');
const ko = require('./locale/ko.json');
const pl = require('./locale/pl.json');
const ptBR = require('./locale/ptBR.json');
const ru = require('./locale/ru.json');
const zhCHS = require('./locale/zhCHS.json');
const zhCHT = require('./locale/zhCHT.json');

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
  'zh-cht': "${zhCHT[key1]?.[key2] ?? en[key1][key2]}",\n};\n`;
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
${getI18nKey('Browsercheck.Steam')}`;

fs.writeFile('src/browsercheck-utils.js', browserCheckUtils, (err) => {
  if (err) {
    // console.log(err);
  }
});
