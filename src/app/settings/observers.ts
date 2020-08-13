import { observeStore } from 'app/utils/redux-utils';
import { settingsSelector } from './reducer';
import i18next from 'i18next';

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
