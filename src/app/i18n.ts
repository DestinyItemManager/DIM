import { setTag } from '@sentry/browser';
import i18next from 'i18next';
import HttpApi, { HttpBackendOptions } from 'i18next-http-backend';
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
import enSrc from '../../config/i18n.json';
import { languageSelector } from './dim-api/selectors';
import { percent } from './shell/formatters';
import { humanBytes } from './storage/human-bytes';
import { StoreObserver } from './store/observerMiddleware';
import { invert } from './utils/collections';
import { infoLog } from './utils/log';

export const DIM_LANG_INFOS = {
  de: { latinBased: true },
  en: { latinBased: true },
  es: { latinBased: true },
  'es-mx': { latinBased: true },
  fr: { latinBased: true },
  it: { latinBased: true },
  ja: { latinBased: false },
  ko: { latinBased: false },
  pl: { latinBased: true },
  'pt-br': { latinBased: true },
  ru: { latinBased: false },
  'zh-chs': { latinBased: false },
  'zh-cht': { latinBased: false },
};

export type DimLanguage = keyof typeof DIM_LANG_INFOS;

export const DIM_LANGS = Object.keys(DIM_LANG_INFOS) as DimLanguage[];

// Our locale names don't line up with the BCP 47 tags for Chinese
export const browserLangToDimLang: Record<string, DimLanguage> = {
  'zh-Hans': 'zh-chs',
  'zh-Hant': 'zh-cht',
};

const dimLangToBrowserLang = invert(browserLangToDimLang);

// Hot-reload translations in dev. You'll still need to get things to re-render when
// translations change (unless we someday switch to react-i18next)
if (typeof module !== 'undefined' && module.hot) {
  module.hot.accept('../../config/i18n.json', () => {
    i18next.reloadResources('en', undefined, () => {
      infoLog('i18n', 'Reloaded translations');
    });
  });
}

function browserLanguage(): DimLanguage {
  const currentBrowserLang = window.navigator.language || 'en';
  const overriddenLang = Object.entries(browserLangToDimLang).find(([browserLang]) =>
    currentBrowserLang.startsWith(browserLang),
  );
  if (overriddenLang) {
    return overriddenLang[1];
  }
  return DIM_LANGS.find((lang) => currentBrowserLang.toLowerCase().startsWith(lang)) || 'en';
}

// Try to pick a nice default language
export function defaultLanguage(): DimLanguage {
  const storedLanguage = localStorage.getItem('dimLanguage') as DimLanguage;
  if (storedLanguage && DIM_LANGS.includes(storedLanguage)) {
    return storedLanguage;
  }
  return browserLanguage();
}

export async function initi18n(): Promise<void> {
  const lang = defaultLanguage();
  // See https://github.com/i18next/i18next
  await i18next.use(HttpApi).init<HttpBackendOptions>({
    debug: false,
    lng: lang,
    // Variants of the same language are mutually intelligible enough that a
    // missing key is better served by the sibling variant than by English.
    fallbackLng: {
      'zh-cht': ['zh-chs', 'en'],
      'zh-chs': ['zh-cht', 'en'],
      'es-mx': ['es', 'en'],
      es: ['es-mx', 'en'],
      default: ['en'],
    },
    lowerCaseLng: true,
    supportedLngs: DIM_LANGS,
    load: 'currentOnly',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath([lng]: string[]) {
        const path = {
          de,
          // In development, directly use the source English translations.
          // In production we use a version that's gone through i18n-scanner
          // to remove unused keys.
          en: $DIM_FLAVOR === 'dev' ? enSrc : en,
          es,
          'es-mx': esMX,
          fr,
          it,
          ja,
          ko,
          pl,
          'pt-br': ptBR,
          ru,
          'zh-chs': zhCHS,
          'zh-cht': zhCHT,
        }[lng] as unknown as string;
        if (!path) {
          throw new Error(`unsupported language ${lng}`);
        }
        return path;
      },
    },
    returnObjects: true,
  });
  i18next.services.formatter?.add('pct', percent);
  i18next.services.formatter?.add('humanBytes', (val) => humanBytes(parseInt(val as string, 10)));
}

// Reflect the setting changes in stored values and in the DOM
export function createLanguageObserver(): StoreObserver<DimLanguage> {
  return {
    id: 'i18n-observer',
    getObserved: languageSelector,
    runInitially: true,
    sideEffect: ({ current }) => {
      if (current === browserLanguage()) {
        localStorage.removeItem('dimLanguage');
      } else {
        localStorage.setItem('dimLanguage', current);
      }
      if (current !== i18next.language) {
        i18next.changeLanguage(current);
      }
      setTag('lang', current);
      document
        .querySelector('html')!
        .setAttribute('lang', dimLangToBrowserLang[current] ?? current);
    },
  };
}
