import { languageSelector } from 'app/dim-api/selectors';
import { DimLanguage } from 'app/i18n';
import { StoreObserver } from 'app/store/observerMiddleware';
import i18next from 'i18next';

export function createLanguageObserver(): StoreObserver<DimLanguage> {
  return {
    id: 'i18n-observer',
    getObserved: languageSelector,
    sideEffect: ({ current }) => {
      localStorage.setItem('dimLanguage', current);
      i18next.changeLanguage(current);
    },
  };
}
