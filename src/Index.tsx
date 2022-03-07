import { saveAccountsToIndexedDB } from 'app/accounts/observers';
import updateCSSVariables from 'app/css-variables';
import { loadDimApiData } from 'app/dim-api/actions';
import { saveItemInfosOnStateChange } from 'app/inventory/observers';
import { loadCoreSettings } from 'app/manifest/actions';
import { pollForBungieAlerts } from 'app/shell/alerts';
import store from 'app/store/store';
import { infoLog } from 'app/utils/log';
import React from 'react';
import ReactDOM from 'react-dom';
import idbReady from 'safari-14-idb-fix';
import setupRateLimiter from './app/bungie-api/rate-limit-config';
import './app/google';
import { initi18n } from './app/i18n';
import './app/main.scss';
import registerServiceWorker from './app/register-service-worker';
import Root from './app/Root';
import { safariTouchFix } from './app/safari-touch-fix';
import { watchLanguageChanges } from './app/settings/observers';
import './app/utils/exceptions';
import { saveWishListToIndexedDB } from './app/wishlists/observers';
import { StorageBroken, storageTest } from './StorageTest';

infoLog(
  'app',
  `DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.github.com/DestinyItemManager/DIM/issues`
);

safariTouchFix();

if ($DIM_FLAVOR !== 'dev') {
  registerServiceWorker();
}

setupRateLimiter();

const i18nPromise = initi18n();

(async () => {
  // idbReady works around a bug in Safari 14 where IndexedDB doesn't initialize sometimes
  await idbReady();
  // Block on testing that we can use LocalStorage and IDB, before everything starts trying to use it
  const storageWorks = await storageTest();
  if (!storageWorks) {
    // Make sure localization is loaded
    await i18nPromise;
    ReactDOM.render(<StorageBroken />, document.getElementById('app'));
    return;
  }

  if ($featureFlags.wishLists) {
    saveWishListToIndexedDB();
  }
  saveAccountsToIndexedDB();
  updateCSSVariables();

  store.dispatch(loadDimApiData());
  store.dispatch(loadCoreSettings());
  store.dispatch(pollForBungieAlerts());

  saveItemInfosOnStateChange();

  // Make sure localization is loaded
  await i18nPromise;

  // Settings depends on i18n
  watchLanguageChanges();

  ReactDOM.render(<Root />, document.getElementById('app'));
})();
