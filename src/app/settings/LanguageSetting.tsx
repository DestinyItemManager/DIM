import { currentAccountSelector } from 'app/accounts/selectors';
import { getDefinitions as getDefinitionsD1 } from 'app/destiny1/d1-definitions';
import { getDefinitions } from 'app/destiny2/d2-definitions';
import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { clearStores } from 'app/inventory/actions';
import { reloadToUpdateManifest } from 'app/manifest/manifest-service-json';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { isMobileBrowser } from 'app/utils/browsers';
import i18next from 'i18next';
import React from 'react';
import { useSelector } from 'react-redux';
import Select, { mapToOptions } from './Select';
import { useSetSetting } from './hooks';

const languageOptions = mapToOptions({
  de: 'Deutsch',
  en: 'English',
  es: 'Español (España)',
  'es-mx': 'Español (México)',
  fr: 'Français',
  it: 'Italiano',
  ko: '한국어',
  pl: 'Polski',
  'pt-br': 'Português (Brasil)',
  ru: 'Русский',
  ja: '日本語',
  'zh-cht': '繁體中文', // Chinese (Traditional)
  'zh-chs': '简体中文', // Chinese (Simplified)
});

export default function LanguageSetting() {
  const dispatch = useThunkDispatch();
  const settings = useSelector(settingsSelector);
  const currentAccount = useSelector(currentAccountSelector);
  const setSetting = useSetSetting();

  const changeLanguage = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value;
    await i18next.changeLanguage(language);
    setSetting('language', language);
    if (currentAccount?.destinyVersion === 2) {
      // On mobile, downloading the new manifest while the old one is still in
      // memory can get the page killed for using too much memory - reload the
      // app instead, so the new language's manifest is downloaded on a fresh
      // boot. (The language setting is persisted to localStorage before this.)
      if (isMobileBrowser() && (await reloadToUpdateManifest())) {
        return;
      }
      await dispatch(getDefinitions(true));
    } else if (currentAccount?.destinyVersion === 1) {
      // force=true so we re-download the manifest in the new language instead of
      // returning the already-loaded definitions from the store.
      await dispatch(getDefinitionsD1(true));
    }
    dispatch(clearStores());
  };

  return (
    <Select
      label={t('Settings.Language')}
      name="language"
      value={settings.language}
      options={languageOptions}
      onChange={changeLanguage}
    />
  );
}
