/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import fs from 'node:fs';

import de from './locale/de.json' assert { type: 'json' };
import en from './locale/en.json' assert { type: 'json' };
import es from './locale/es.json' assert { type: 'json' };
import esMX from './locale/esMX.json' assert { type: 'json' };
import fr from './locale/fr.json' assert { type: 'json' };
import it from './locale/it.json' assert { type: 'json' };
import ja from './locale/ja.json' assert { type: 'json' };
import ko from './locale/ko.json' assert { type: 'json' };
import pl from './locale/pl.json' assert { type: 'json' };
import ptBR from './locale/ptBR.json' assert { type: 'json' };
import ru from './locale/ru.json' assert { type: 'json' };
import zhCHS from './locale/zhCHS.json' assert { type: 'json' };
import zhCHT from './locale/zhCHT.json' assert { type: 'json' };

/**
 * @param {string} key
 */
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
${getI18nKey('Browsercheck.Steam')}`;

fs.writeFileSync('src/browsercheck-utils.js', browserCheckUtils);
