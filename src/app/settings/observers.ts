import { settingsSelector } from 'app/dim-api/selectors';
import { observeStore } from 'app/utils/redux-utils';
import i18next from 'i18next';

export function watchLanguageChanges() {
  return observeStore(
    (state) => settingsSelector(state).language,
    (_prev, language) => {
      const languageChanged = language !== i18next.language;
      localStorage.setItem('dimLanguage', language);
      if (languageChanged) {
        i18next.changeLanguage(language);
      }
    }
  );
}
