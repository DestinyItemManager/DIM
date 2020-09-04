import { observeStore } from 'app/utils/redux-utils';
import i18next from 'i18next';
import { settingsSelector } from './reducer';

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
