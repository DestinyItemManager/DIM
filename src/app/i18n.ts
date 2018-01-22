// tslint:disable:no-implicit-dependencies
import en from 'file-loader?name=[name]-[hash:6].[ext]!../locale/dim.json';
import it from 'file-loader?name=[name]-[hash:6].[ext]!../locale/it/dim.json';
import de from 'file-loader?name=[name]-[hash:6].[ext]!../locale/de/dim.json';
import fr from 'file-loader?name=[name]-[hash:6].[ext]!../locale/fr/dim.json';
import es from 'file-loader?name=[name]-[hash:6].[ext]!../locale/es-ES/dim.json';
import esMX from 'file-loader?name=[name]-[hash:6].[ext]!../locale/es-MX/dim.json';
import ja from 'file-loader?name=[name]-[hash:6].[ext]!../locale/ja/dim.json';
import pl from 'file-loader?name=[name]-[hash:6].[ext]!../locale/pl/dim.json';
import ptBR from 'file-loader?name=[name]-[hash:6].[ext]!../locale/pt-BR/dim.json';
import ru from 'file-loader?name=[name]-[hash:6].[ext]!../locale/ru/dim.json';
import zhCHT from 'file-loader?name=[name]-[hash:6].[ext]!../locale/zh-CN/dim.json';

import { init as i18init, use as i18use } from 'i18next';
import XHR from 'i18next-xhr-backend';

export const DIM_LANGS = ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'ja', 'pl', 'pt-br', 'ru', 'zh-cht'];

// Try to pick a nice default language
export function defaultLanguage(): string {
  if (localStorage.dimLanguage && DIM_LANGS.includes(localStorage.dimLanguage)) {
    return localStorage.dimLanguage;
  }
  const browserLang = (window.navigator.language || 'en').toLowerCase();
  return DIM_LANGS.find((lang) => browserLang.startsWith(lang)) || 'en';
}

export function initi18n(): Promise<never> {
  return new Promise((resolve, reject) => {
    // See https://github.com/i18next/ng-i18next
    i18use(XHR);
    i18init({
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
            return `${Math.min(100, Math.floor(100 * parseInt(val, 10)))}%`;
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
            'zh-cht': zhCHT
          }[lng];
          if (!path) {
            throw new Error(`unsupported language ${lng}`);
          }
          return path;
        }
      },
      returnObjects: true
    }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
