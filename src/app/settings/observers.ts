import { languageSelector } from 'app/dim-api/selectors';
import { observeStore } from 'app/utils/redux-utils';
import i18next from 'i18next';

export function watchLanguageChanges() {
  return observeStore(languageSelector, (_prev, language) => {
    const languageChanged = language !== i18next.language;
    localStorage.setItem('dimLanguage', language);
    if (languageChanged) {
      i18next.changeLanguage(language);
    }
  });
}
