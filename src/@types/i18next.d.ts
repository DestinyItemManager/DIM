// import the original type declarations
import en from 'config/i18n.json' assert { type: 'json' };
import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}
