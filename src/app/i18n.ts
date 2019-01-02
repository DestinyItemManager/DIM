import en from '../locale/dim.json';
import ko from '../locale/ko/dim.json';
import it from '../locale/it/dim.json';
import de from '../locale/de/dim.json';
import fr from '../locale/fr/dim.json';
import es from '../locale/es-ES/dim.json';
import esMX from '../locale/es-MX/dim.json';
import ja from '../locale/ja/dim.json';
import pl from '../locale/pl/dim.json';
import ptBR from '../locale/pt-BR/dim.json';
import ru from '../locale/ru/dim.json';
import zhCHT from '../locale/zh-TW/dim.json';
import zhCHS from '../locale/zh-CN/dim.json';

import { init as i18init, use as i18use } from 'i18next';
import XHR from 'i18next-xhr-backend';
import { humanBytes } from './storage/human-bytes';
import { percent } from './inventory/dimPercentWidth.directive';

export const DIM_LANGS = [
  'de',
  'en',
  'es',
  'es-mx',
  'fr',
  'it',
  'ja',
  'pl',
  'pt-br',
  'ru',
  'ko',
  'zh-cht',
  'zh-chs'
];

// Try to pick a nice default language
export function defaultLanguage(): string {
  const storedLanguage = localStorage.getItem('dimLanguage');
  if (storedLanguage && DIM_LANGS.includes(storedLanguage)) {
    return storedLanguage;
  }
  const browserLang = (window.navigator.language || 'en').toLowerCase();
  return DIM_LANGS.find((lang) => browserLang.startsWith(lang)) || 'en';
}

export function initi18n(): Promise<never> {
  return new Promise((resolve, reject) => {
    // See https://github.com/i18next/ng-i18next
    i18use(XHR);
    i18init(
      {
        initImmediate: true,
        debug: $DIM_FLAVOR === 'dev',
        lng: defaultLanguage(),
        fallbackLng: 'en',
        lowerCaseLng: true,
        load: 'currentOnly',
        interpolation: {
          escapeValue: false,
          format(val, format) {
            if (format === 'pct') {
              return percent(parseFloat(val));
            } else if (format === 'humanBytes') {
              return humanBytes(parseInt(val, 10));
            }
            return val;
          }
        },
        backend: {
          loadPath(lng) {
            const path = {
              en,
              it,
              de,
              fr,
              es,
              'es-mx': esMX,
              ja,
              'pt-br': ptBR,
              pl,
              ru,
              ko,
              'zh-cht': zhCHT,
              'zh-chs': zhCHS
            }[lng];
            if (!path) {
              throw new Error(`unsupported language ${lng}`);
            }
            return path;
          }
        },
        returnObjects: true
      },
      (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}
