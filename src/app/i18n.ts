import i18next from 'i18next';
import HttpApi from 'i18next-http-backend';
import de from 'locale/de.json';
import en from 'locale/en.json';
import es from 'locale/es.json';
import esMX from 'locale/esMX.json';
import fr from 'locale/fr.json';
import it from 'locale/it.json';
import ja from 'locale/ja.json';
import ko from 'locale/ko.json';
import pl from 'locale/pl.json';
import ptBR from 'locale/ptBR.json';
import ru from 'locale/ru.json';
import zhCHS from 'locale/zhCHS.json';
import zhCHT from 'locale/zhCHT.json';
import { humanBytes } from './storage/human-bytes';

const PLURAL_OVERRIDES = ['ja', 'pl', 'ru', 'ko', 'zh-cht', 'zh-chs'];
const DIM_LANGS = [
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
  'zh-chs',
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

export function initi18n(): Promise<unknown> {
  const lang = defaultLanguage();
  return new Promise((resolve, reject) => {
    // See https://github.com/i18next/i18next
    i18next.use(HttpApi).init(
      {
        initImmediate: true,
        debug: $DIM_FLAVOR === 'dev',
        lng: lang,
        fallbackLng: 'en',
        supportedLngs: DIM_LANGS,
        lowerCaseLng: true,
        load: 'currentOnly',
        interpolation: {
          escapeValue: false,
          format(val: string, format) {
            switch (format) {
              case 'pct':
                return `${Math.min(100, Math.floor(100 * parseFloat(val)))}%`;
              case 'humanBytes':
                return humanBytes(parseInt(val, 10));
              case 'number':
                return parseInt(val, 10).toLocaleString();
              default:
                return val;
            }
          },
        },
        backend: {
          loadPath([lng]: string[]) {
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
              'zh-chs': zhCHS,
            }[lng] as unknown as string;
            if (!path) {
              throw new Error(`unsupported language ${lng}`);
            }
            return path;
          },
        },
        returnObjects: true,
      },
      (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(undefined);
        }
      }
    );
    if (PLURAL_OVERRIDES.includes(lang)) {
      i18next.services.pluralResolver.addRule(lang, i18next.services.pluralResolver.getRule('en'));
    }
  });
}
