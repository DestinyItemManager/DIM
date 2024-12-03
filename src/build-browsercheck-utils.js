/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import fs from 'node:fs';

import de from './locale/de.json' with { type: 'json' };
import en from './locale/en.json' with { type: 'json' };
import es from './locale/es.json' with { type: 'json' };
import esMX from './locale/esMX.json' with { type: 'json' };
import fr from './locale/fr.json' with { type: 'json' };
import it from './locale/it.json' with { type: 'json' };
import ja from './locale/ja.json' with { type: 'json' };
import ko from './locale/ko.json' with { type: 'json' };
import pl from './locale/pl.json' with { type: 'json' };
import ptBR from './locale/ptBR.json' with { type: 'json' };
import ru from './locale/ru.json' with { type: 'json' };
import zhCHS from './locale/zhCHS.json' with { type: 'json' };
import zhCHT from './locale/zhCHT.json' with { type: 'json' };

/**
 * @param {string} key
 */
function getI18nKey(key) {
  let key1 = key.split('.')[0];
  let key2 = key.split('.')[1];
  let getStringFor = (lang) => {
    const str = lang[key1]?.[key2] ?? en[key1][key2];
    return JSON.stringify(str);
  };
  return `  en: ${getStringFor(en)},
  de: ${getStringFor(de)},
  es: ${getStringFor(es)},
  'es-mx': ${getStringFor(esMX)},
  fr: ${getStringFor(fr)},
  it: ${getStringFor(it)},
  ja: ${getStringFor(ja)},
  ko: ${getStringFor(ko)},
  pl: ${getStringFor(pl)},
  'pt-br': ${getStringFor(ptBR)},
  ru: ${getStringFor(ru)},
  'zh-chs': ${getStringFor(zhCHS)},
  'zh-cht': ${getStringFor(zhCHT)},\n};`;
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

export const samsungInternet = {
${getI18nKey('Browsercheck.Samsung')}`;

fs.writeFileSync('src/browsercheck-utils.js', browserCheckUtils);
