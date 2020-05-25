import i18next from 'i18next';
import _ from 'lodash';
import { observeStore } from '../utils/redux-utils';
import { settingsSelector } from './reducer';

export let readyResolve;
export const settingsReady = new Promise((resolve) => (readyResolve = resolve));

export function watchLanguageChanges() {
  return observeStore(
    (state) => settingsSelector(state).language,
    (_, language) => {
      const languageChanged = language !== i18next.language;
      localStorage.setItem('dimLanguage', language);
      if (languageChanged) {
        i18next.changeLanguage(language);
      }
    }
  );
}
